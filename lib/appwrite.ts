import {
  Account,
  Avatars,
  Client,
  Databases,
  ID,
  ImageGravity,
  Query,
  Storage,
  Models,
} from "react-native-appwrite";

export const appwriteConfig = {
  endpoint: "https://cloud.appwrite.io/v1",
  platform: process.env.EXPO_PUBLIC_APPWRITE_PLATFORM,
  projectId: process.env.EXPO_PUBLIC_APPWRITE_PROJECTID,
  storageId: process.env.EXPO_PUBLIC_APPWRITE_STORAGEID,
  databaseId: process.env.EXPO_PUBLIC_APPWRITE_DATABASEID,
  bookmarkCollectionId: process.env.EXPO_PUBLIC_APPWRITE_BOOKMARK_COLLECTION_ID,
  videoCollectionId: process.env.EXPO_PUBLIC_APPWRITE_VIDEO_COLLECTION_ID,
  userCollectionId: process.env.EXPO_PUBLIC_APPWRITE_USER_COLLECTION_ID,
};

const client = new Client();

client
  .setEndpoint(appwriteConfig.endpoint)
  .setProject(appwriteConfig.projectId)
  .setPlatform(appwriteConfig.platform);

const account = new Account(client);
const storage = new Storage(client);
const avatars = new Avatars(client);
const databases = new Databases(client);

// Register user
export async function createUser(
  email: string,
  password: string,
  username: string
) {
  try {
    const newAccount = await account.create(
      ID.unique(),
      email,
      password,
      username
    );

    if (!newAccount) throw Error;

    const avatarUrl = avatars.getInitials(username);

    await signIn(email, password);

    const newUser = await databases.createDocument(
      appwriteConfig.databaseId,
      appwriteConfig.userCollectionId,
      ID.unique(),
      {
        accountId: newAccount.$id,
        email: email,
        username: username,
        avatar: avatarUrl,
      }
    );

    return newUser;
  } catch (error: any) {
    throw new Error(error);
  }
}

// Sign In
export async function signIn(email: string, password: string) {
  try {
    const session = await account.createEmailPasswordSession(email, password);

    return session;
  } catch (error: any) {
    throw new Error(error);
  }
}

// Get Account
export async function getAccount() {
  try {
    const currentAccount = await account.get();

    return currentAccount;
  } catch (error: any) {
    throw new Error(error);
  }
}

// Get Current User
export async function getCurrentUser() {
  try {
    const currentAccount = await getAccount();
    if (!currentAccount) throw Error;

    const currentUser = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.userCollectionId,
      [Query.equal("accountId", currentAccount.$id)]
    );

    if (!currentUser) throw Error;

    return currentUser.documents[0];
  } catch (error: any) {
    console.log(error);
    return null;
  }
}

// Sign Out
export async function signOut() {
  try {
    const session = await account.deleteSession("current");

    return session;
  } catch (error: any) {
    throw new Error(error);
  }
}

// Upload File
export async function uploadFile(file: any, type: FileType) {
  if (!file) return;

  const { mimeType, ...rest } = file;
  const asset = { type: mimeType, ...rest };

  try {
    const uploadedFile = await storage.createFile(
      appwriteConfig.storageId,
      ID.unique(),
      asset
    );

    const fileUrl = await getFilePreview(uploadedFile.$id, type);
    return fileUrl;
  } catch (error: any) {
    throw new Error(error);
  }
}

// Get File Preview
export async function getFilePreview(fileId: string, type: FileType) {
  let fileUrl;

  try {
    if (type === "video") {
      fileUrl = storage.getFileView(appwriteConfig.storageId, fileId);
    } else if (type === "image") {
      fileUrl = storage.getFilePreview(
        appwriteConfig.storageId,
        fileId,
        2000,
        2000,
        ImageGravity.Top,
        100
      );
    } else {
      throw new Error("Invalid file type");
    }

    if (!fileUrl) throw Error;

    return fileUrl;
  } catch (error: any) {
    throw new Error(error);
  }
}

// Create Video Post
export async function createVideoPost(form) {
  try {
    const [thumbnailUrl, videoUrl] = await Promise.all([
      uploadFile(form.thumbnail, "image"),
      uploadFile(form.video, "video"),
    ]);

    const newPost = await databases.createDocument(
      appwriteConfig.databaseId,
      appwriteConfig.videoCollectionId,
      ID.unique(),
      {
        title: form.title,
        thumbnail: thumbnailUrl,
        video: videoUrl,
        prompt: form.prompt,
        creator: form.userId,
      }
    );

    return newPost;
  } catch (error: any) {
    throw new Error(error);
  }
}

// Get all video Posts
export async function getAllPosts(): Promise<(Post & Models.Document)[]> {
  try {
    const posts = await databases.listDocuments<Post & Models.Document>(
      appwriteConfig.databaseId,
      appwriteConfig.videoCollectionId,
      [(Query.orderDesc("$createdAt"), Query.limit(10))]
    );

    return posts.documents;
  } catch (error: any) {
    throw new Error(error);
  }
}

// Get video posts created by user
export async function getUserPosts(userId: string) {
  try {
    const posts = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.videoCollectionId,
      [Query.equal("creator", userId)]
    );

    return posts.documents;
  } catch (error: any) {
    throw new Error(error);
  }
}

// Get video posts that matches search query
export async function searchPosts(query: string) {
  try {
    const posts = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.videoCollectionId,
      [Query.search("title", query)]
    );

    if (!posts) throw new Error("Something went wrong");

    return posts.documents;
  } catch (error: any) {
    throw new Error(error);
  }
}

// Get latest created video posts
export async function getLatestPosts(): Promise<Post[]> {
  try {
    const posts = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.videoCollectionId,
      [Query.orderDesc("$createdAt"), Query.limit(7)]
    );

    return posts.documents as unknown as Post[];
  } catch (error: any) {
    throw new Error(error);
  }
}

type BookmarkType = Models.DocumentList<Bookmark & Models.Document>;

async function createVideoBookmark(userId: string, videoId: string) {
  try {
    // If no document exists, create a new one
    await databases.createDocument<Bookmark & Models.Document>(
      appwriteConfig.databaseId,
      appwriteConfig.bookmarkCollectionId,
      ID.unique(),
      {
        user: userId,
        videos: [videoId],
      }
    );
  } catch (error) {}
}

async function addVideoToBookmark(response: BookmarkType, videoId: string) {
  try {
    let document: Bookmark & Models.Document;

    // If document exists, take the first one
    document = response.documents[0];

    // Check if the videoId is already in the videos array
    const updatedVideos = document.videos.includes(videoId)
      ? document.videos
      : [...document.videos, videoId];

    // Update the document with the new videos array
    const updatedDocument = await databases.updateDocument<
      Bookmark & Models.Document
    >(
      appwriteConfig.databaseId,
      appwriteConfig.bookmarkCollectionId,
      document.$id,
      {
        videos: updatedVideos,
      }
    );
  } catch (error: any) {
    throw new Error(error);
  }
}

async function removeVideoFromBookmark(
  response: BookmarkType,
  videoId: string
) {
  try {
    // Query for documents where the 'user' field matches the provided userId

    if (response.documents.length > 0) {
      // If document exists, take the first one
      const document = response.documents[0];

      // Remove the videoId from the videos array
      const updatedVideos = document.videos.filter((video) => {
        return video.$id !== videoId;
      });

      if (updatedVideos.length === document.videos.length) {
        console.log("Video ID not found in bookmark.");
        return;
      }

      // Update the document with the new videos array
      await databases.updateDocument<Bookmark & Models.Document>(
        appwriteConfig.databaseId,
        appwriteConfig.bookmarkCollectionId,
        document.$id,
        {
          videos: updatedVideos,
        }
      );
    } else {
    }
  } catch (error: any) {
    throw new Error(error);
  }
}

export async function handleVideoBookmark(userId: string, videoId: string) {
  try {
    const isDocExist = await databases.listDocuments<
      Bookmark & Models.Document
    >(appwriteConfig.databaseId, appwriteConfig.bookmarkCollectionId, [
      Query.equal("user", userId),
    ]);

    console.log({ checkLength: isDocExist.documents.length > 0 });

    if (isDocExist.documents.length > 0) {
      const document = isDocExist.documents[0];

      // Check if the videoId is already in the videos array
      const videoIds = document.videos.map((video) => video.$id);
      console.log({ videoId });

      const isVideoExist = videoIds.includes(videoId);

      if (!isVideoExist) {
        addVideoToBookmark(isDocExist, videoId);
        console.log("berhasil tambah bookmark");
        return true;
      }
      removeVideoFromBookmark(isDocExist, videoId);
      console.log("berhasil hapus bookmark");
      return false;
    } else {
      createVideoBookmark(userId, videoId);
      console.log("berhasil tambah bookmark");
      return true;
    }
  } catch (error: any) {
    throw new Error(error);
  }
}

export async function getBookmarkPosts(
  userId: string
): Promise<(Bookmark & Models.Document)[]> {
  try {
    const bookmark = await databases.listDocuments<Bookmark & Models.Document>(
      appwriteConfig.databaseId,
      appwriteConfig.bookmarkCollectionId,
      [Query.equal("user", userId)]
    );

    return bookmark.documents;
  } catch (error: any) {
    throw new Error(error);
  }
}

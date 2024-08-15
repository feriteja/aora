declare type Post = {
  $id?: string;
  title: string;
  thumbnail: string;
  prompt: string;
  video: string;
  creator: UserModel;
  bookmark: Bookmark[];
};
// Define the User type
declare type User = {
  username: string;
  email: string;
  avatar: string;
  accountId: string;
};

// Define the Models type for common fields
type Models = {
  $id: string;
  $collectionId: string;
  $databaseId: string;
  $createdAt: string;
  $updatedAt: string;
  $permissions: string[];
};

// Combine User and Models to create a UserModel type
type UserModel = User & Models;

// Define the Bookmark type
declare type Bookmark = {
  user: UserModel; // Use UserModel type for user
  videos: Post[];
};

declare type VideoCardProps = {
  postId?: string;
  title: string;
  creator: string;
  avatar: string;
  thumbnail: string;
  video: string;
  isBookmarked?: boolean;
  hideBookMark?: boolean;
};

declare type BookmarkModel = Bookmark & Models.Document;

declare type FileType = "video" | "image";

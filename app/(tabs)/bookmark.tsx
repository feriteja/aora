import { VideoCard } from "@/components";
import { useGlobalContext } from "@/context/GlobalProvider";
import { getAllPosts, getBookmarkPosts } from "@/lib/appwrite";
import useAppwrite from "@/lib/useAppwrite";
import { useEffect, useState } from "react";
import { FlatList, RefreshControl, Text, View } from "react-native";
import { ID, Models } from "react-native-appwrite";
import { SafeAreaView } from "react-native-safe-area-context";

const Bookmark = () => {
  const { user } = useGlobalContext();
  const {
    data: bookmarks,
    loading,
    refetch,
  } = useAppwrite(() => getBookmarkPosts(user!.$id));
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  useEffect(() => {
    onRefresh();
  }, []);

  const bookmarkData = bookmarks?.map((it) => it.videos)[0];

  return (
    <SafeAreaView className="px-4 my-6 bg-primary h-full">
      <FlatList
        data={bookmarkData}
        keyExtractor={(item) => item.$id!}
        key={ID.unique()}
        renderItem={({ item }) => {
          const isBookmarked = user?.$id === item?.creator.$id;
          return (
            <VideoCard
              postId={item.$id!}
              title={item.title}
              thumbnail={item.thumbnail}
              video={item.video}
              creator={item.creator.username}
              avatar={item.creator.avatar}
              isBookmarked={isBookmarked}
            />
          );
        }}
        ListHeaderComponent={() => (
          <View>
            <Text>Bookmark</Text>
          </View>
        )}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      />
    </SafeAreaView>
  );
};

export default Bookmark;

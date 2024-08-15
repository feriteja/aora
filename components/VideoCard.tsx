import { useState } from "react";
import {
  AVPlaybackStatus,
  AVPlaybackStatusSuccess,
  ResizeMode,
  Video,
} from "expo-av";
import { View, Text, Pressable, Image } from "react-native";
import FontAwesome from "@expo/vector-icons/FontAwesome";

import { icons } from "../constants";
import { handleVideoBookmark } from "@/lib/appwrite";
import { useGlobalContext } from "@/context/GlobalProvider";

const VideoCard = ({
  postId,
  title,
  creator,
  avatar,
  thumbnail,
  video,
  isBookmarked,
}: VideoCardProps) => {
  const [play, setPlay] = useState(false);
  const { user } = useGlobalContext();
  const [isBookmarkedState, setIsBookmarkedState] = useState(isBookmarked);

  const onBookmarkHandler = async () => {
    try {
      setIsBookmarkedState((prev) => !prev);
      const result = await handleVideoBookmark(user?.$id!, postId);
      setIsBookmarkedState(result);
    } catch (error: any) {
      throw new Error(error);
    }
  };

  return (
    <View className="flex flex-col items-center px-4 mb-14 border-b-2 border-red-500">
      <View className="flex flex-row gap-3 items-start">
        <View className="flex justify-center items-center flex-row flex-1">
          <View className="w-[46px] h-[46px] rounded-lg border border-secondary flex justify-center items-center p-0.5">
            <Image
              source={{ uri: avatar }}
              className="w-full h-full rounded-lg"
              resizeMode="cover"
            />
          </View>

          <View className="flex justify-center flex-1 ml-3 gap-y-1">
            <Text
              className="font-psemibold text-sm text-white"
              numberOfLines={1}
            >
              {title}
            </Text>
            <Text
              className="text-xs text-gray-100 font-pregular"
              numberOfLines={1}
            >
              {creator}
            </Text>
          </View>
        </View>

        <Pressable
          onPress={onBookmarkHandler}
          className="pt-2 active:opacity-70"
        >
          {isBookmarkedState ? (
            <FontAwesome name="bookmark" size={28} color="white" />
          ) : (
            <FontAwesome name="bookmark-o" size={28} color="white" />
          )}
        </Pressable>
      </View>

      {play ? (
        <Video
          source={{ uri: video }}
          className="w-full h-60 rounded-xl mt-3"
          resizeMode={ResizeMode.CONTAIN}
          useNativeControls
          shouldPlay
          onPlaybackStatusUpdate={(status: AVPlaybackStatus) => {
            if (
              status.isLoaded &&
              (status as AVPlaybackStatusSuccess).didJustFinish
            ) {
              setPlay(false);
            }
          }}
        />
      ) : (
        <Pressable
          onPress={() => setPlay(true)}
          className="w-full h-60 active:opacity-70 rounded-xl mt-3 relative flex justify-center items-center"
        >
          <Image
            source={{ uri: thumbnail }}
            className="w-full h-full rounded-xl mt-3"
            resizeMode="cover"
          />

          <Image
            source={icons.play}
            className="w-12 h-12 absolute"
            resizeMode="contain"
          />
        </Pressable>
      )}
    </View>
  );
};

export default VideoCard;

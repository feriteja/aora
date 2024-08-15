declare type Post = {
  $id?: string;
  title: string;
  thumbnail: string;
  prompt: string;
  video: string;
  creator: User;
};

declare type User = {
  username: string;
  email: string;
  avatar: string;
  accountId: string;
};

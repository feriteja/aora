import { Alert } from "react-native";
import { useEffect, useState } from "react";

type AsyncFunction<T> = () => Promise<T>;

interface UseAppwriteReturn<T> {
  data: T | null;
  loading: boolean;
  refetch: () => void;
}

function useAppwrite<T>(fn: AsyncFunction<T>): UseAppwriteReturn<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fn();
      setData(res);
    } catch (error: any) {
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const refetch = () => fetchData();

  return { data, loading, refetch };
}

export default useAppwrite;

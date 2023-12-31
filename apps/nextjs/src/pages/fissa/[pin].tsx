import { useEffect } from "react";
import { useRouter } from "next/router";

const JoinFissa = () => {
  const { query } = useRouter();

  useEffect(() => {
    if (!query.pin) return;

    window.location.replace(`com.fissa://fissa/${query.pin}`);
  }, [query.pin]);

  return <div>Joining fissa {query.pin}</div>;
};

export default JoinFissa;

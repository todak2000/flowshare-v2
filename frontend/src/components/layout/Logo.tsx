import { Droplet } from "lucide-react";
import { useRouter } from "next/navigation";

export const Logo = () => {
  const router = useRouter();
  return (
    <div
      onClick={() => router.push("/")}
      className="flex cursor-pointer items-center space-x-2"
    >
      <div className="relative">
        <div className="w-10 h-10 bg-linear-to-br from-blue-500 via-purple-600 to-cyan-500 rounded-lg flex items-center justify-center">
          <Droplet className="w-6 h-6 text-white" />
        </div>
        <div className="absolute -top-1 -right-1 w-4 h-4 bg-linear-to-r from-yellow-400 to-orange-500 rounded-full animate-pulse"></div>
      </div>
      <span className="text-2xl font-bold bg-linear-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
        FlowShare
      </span>
    </div>
  );
};

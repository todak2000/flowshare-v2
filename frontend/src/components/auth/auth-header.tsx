import { CardTitle, CardDescription } from "@/components/ui/card";

interface AuthHeaderProps {
  title: string;
  description: string;
}

export function AuthHeader({ title, description }: AuthHeaderProps) {
  return (
    <>
      <CardTitle className="text-2xl my-3">{title}</CardTitle>
      <CardDescription>{description}</CardDescription>
    </>
  );
}

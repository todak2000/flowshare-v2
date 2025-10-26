import Link from "next/link";

interface AuthFooterLinkProps {
  href: string;
  label: string;
  question: string;
}

export function AuthFooterLink({ href, label, question }: AuthFooterLinkProps) {
  return (
    <div className="text-center text-sm">
      {question}{" "}
      <Link href={href} className="text-primary hover:underline">
        {label}
      </Link>
    </div>
  );
}

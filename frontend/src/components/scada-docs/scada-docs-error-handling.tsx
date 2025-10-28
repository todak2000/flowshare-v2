import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ERROR_CODES } from "./constants";



export function SCADADocsErrorHandling() {
  return (
    <section id="errors">
      <Card>
        <CardHeader>
          <CardTitle>Error Handling</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {ERROR_CODES.map((error) => (
              <div
                key={error.code}
                className="border-l-2 border-destructive pl-3"
              >
                <div className="flex items-center gap-2">
                  <code className="text-sm font-mono font-bold">
                    {error.code}
                  </code>
                  <span className="font-semibold">{error.title}</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {error.description}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </section>
  );
}

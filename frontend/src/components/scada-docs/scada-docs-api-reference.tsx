import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { API_PARAMETERS, RESPONSE_EXAMPLE } from "./constants";


export function SCADADocsApiReference() {
  return (
    <section id="reference">
      <Card>
        <CardHeader>
          <CardTitle>API Reference</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h4 className="font-semibold mb-3">Request Body Parameters</h4>
            <div className="space-y-3">
              {API_PARAMETERS.map((param) => (
                <div
                  key={param.name}
                  className="border-l-2 border-primary pl-3"
                >
                  <div className="flex items-center gap-2">
                    <code className="text-sm font-mono">{param.name}</code>
                    <span className="text-xs text-muted-foreground">
                      {param.type}
                    </span>
                    {param.required && (
                      <span className="text-xs text-destructive">required</span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {param.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-3">Response (201 Created)</h4>
            <div className="bg-muted rounded-lg p-4">
              <pre className="text-sm overflow-x-auto">{RESPONSE_EXAMPLE}</pre>
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Code, Copy } from "lucide-react";

interface CodeExamples {
  curl: string;
  python: string;
  javascript: string;
}

interface SCADADocsCodeExamplesProps {
  selectedLanguage: string;
  onLanguageChange: (language: string) => void;
  codeExamples: CodeExamples;
  onCopyCode: (code: string) => void;
}

export function SCADADocsCodeExamples({
  selectedLanguage,
  onLanguageChange,
  codeExamples,
  onCopyCode,
}: SCADADocsCodeExamplesProps) {
  return (
    <section id="examples">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Code className="h-5 w-5" />
            Code Examples
          </CardTitle>
          <CardDescription>
            Integration examples in multiple programming languages
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Tabs value={selectedLanguage} onValueChange={onLanguageChange}>
            <TabsList>
              {[
                { value: "curl", label: "cURL" },
                { value: "python", label: "Python" },
                { value: "javascript", label: "JavaScript" },
              ].map((tab) => (
                <TabsTrigger key={tab.value} value={tab.value}>
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
            {Object.entries(codeExamples).map(([lang, code]) => (
              <TabsContent key={lang} value={lang}>
                <div className="relative">
                  <Button
                    size="sm"
                    variant="outline"
                    className="absolute top-2 right-2 z-10"
                    onClick={() => onCopyCode(code)}
                  >
                    <Copy className="h-3 w-3 mr-2" />
                    Copy
                  </Button>
                  <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
                    <code>{code}</code>
                  </pre>
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </section>
  );
}

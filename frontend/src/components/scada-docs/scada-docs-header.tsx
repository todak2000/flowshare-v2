import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Zap } from "lucide-react";

export function SCADADocsHeader() {
  return (
    <div className="border-b bg-card">
      <div className="container mx-auto px-6 py-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between">
          <div>
            <h1 className="text-lg md:text-3xl font-bold mb-2">
              SCADA API Documentation
            </h1>
            <p className="text-xs md:text-base my-3 text-muted-foreground">
              Connect your SCADA systems to FlowShare in minutes
            </p>
          </div>
          <Link href="/dashboard/scada-setup">
            <Button>
              <Zap className="mr-2 h-4 w-4" />
              Setup & Manage Keys
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

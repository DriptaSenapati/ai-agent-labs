import { Button } from "@/components/ui/button";
import { Brain } from "lucide-react";
import Link from "next/link";

export default function Home() {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center space-y-2.5">
        <h1 className="text-4xl font-bold mb-4">
          Take your skills up with an Ai Interviewer
        </h1>
        <p className="text-lg text-muted-foreground">
          Start a conversation with our AI agent.
        </p>

        <Link href="/call-agent">
          <Button className="mt-4 rounded-2xl p-5 text-sm" size={"lg"}>
            <Brain size={32} />
            Give a Test Call
          </Button>
        </Link>
      </div>
    </div>
  );
}

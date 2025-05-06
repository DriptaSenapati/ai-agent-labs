import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import MeetAgent from "@/components/views/MeetAgent";
import { verifyAndGetQuestions } from "@/lib/actions/meetingActions";
import { AlertCircle } from "lucide-react";
import Link from "next/link";
import React from "react";

type Params = Promise<{ slug: string }>;

const AIMeeting = async (props: { params: Params }) => {
  const params = await props.params;
  const meetingData = await verifyAndGetQuestions(params.slug);

  if (meetingData.status !== 200) {
    return (
      <div className="w-full h-full flex justify-center items-center">
        <div className="w-1/2 flex justify-center flex-col items-center gap-3.5 max-md:w-[90%]">
          <Alert variant="destructive" className="border-destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{meetingData.message}</AlertDescription>
          </Alert>
          <Link href={"/"}>
            <Button>Go to Main Page</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <MeetAgent
      prompt={meetingData.prompt!}
      callSlug={params.slug}
      imageKey={meetingData.imageKey}
    />
  );
};

export default AIMeeting;

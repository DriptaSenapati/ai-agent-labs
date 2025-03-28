"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ChevronUp, Mic, MicOff, PhoneOff } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";

type Props = {
  mediaStream: MediaStream | null;
  setMediaStream: React.Dispatch<React.SetStateAction<MediaStream | null>>;
  micOn: boolean;
  setMicOn: React.Dispatch<React.SetStateAction<boolean>>;
  classNames?: string;
  handleStopConvesation: () => Promise<void>;
};

const MeetButtonControls = ({
  mediaStream,
  setMediaStream,
  micOn,
  setMicOn,
  classNames,
  handleStopConvesation,
}: Props) => {
  const [audioDevices, setAudioDevices] = useState<
    { deviceId: string; deviceName: string }[]
  >([]);

  const [audioOutputDevices, setAudioOutputDevices] = useState<
    { deviceId: string; deviceName: string }[]
  >([]);

  const [videoInputDevices, setVideoInputDevices] = useState<
    { deviceId: string; deviceName: string }[]
  >([]);

  const [audioInputDeviceId, setAudioInputDeviceId] = useState("");
  const [audioOutputDeviceId, setAudioOutputDeviceId] = useState("");
  const [videoInputDeviceID, setVideoInputDeviceID] = useState("");
  const router = useRouter();

  const handleEndCall = async () => {
    await handleStopConvesation().then(() => router.replace("/"));
  };

  useEffect(() => {
    if (micOn) {
      const handleAudioDevices = async () => {
        navigator.mediaDevices.enumerateDevices().then((devices) => {
          const audioDevices = devices.filter(
            (device) =>
              device.kind === "audioinput" &&
              device.deviceId !== "communications"
          );
          setAudioDevices(
            audioDevices
              .filter((device) => !device.label.toString().includes("Default"))
              .map((device) => ({
                deviceId: device.deviceId,
                deviceName: device.label.toString(),
              }))
          );

          const selectedDeviceName = audioDevices
            .find((device) => device.label.toString().includes("Default"))
            ?.label.toString()
            .replace("Default - ", "");

          const selectedDevice = audioDevices.find(
            (device) => device.label.toString() === selectedDeviceName
          );

          setAudioInputDeviceId(
            selectedDevice?.deviceId || audioDevices[0].deviceId
          );
        });
      };
      const handleAudioOutputDevices = async () => {
        navigator.mediaDevices.enumerateDevices().then((devices) => {
          const audioDevices = devices.filter(
            (device) =>
              device.kind === "audiooutput" &&
              device.deviceId !== "communications"
          );
          setAudioOutputDevices(
            audioDevices
              .filter((device) => !device.label.toString().includes("Default"))
              .map((device) => ({
                deviceId: device.deviceId,
                deviceName: device.label.toString(),
              }))
          );

          const selectedDeviceName = audioDevices
            .find((device) => device.label.toString().includes("Default"))
            ?.label.toString()
            .replace("Default - ", "");

          const selectedDevice = audioDevices.find(
            (device) => device.label.toString() === selectedDeviceName
          );

          setAudioOutputDeviceId(
            selectedDevice?.deviceId || audioDevices[0].deviceId
          );
        });
      };

      handleAudioDevices();
      handleAudioOutputDevices();
    }
  }, [micOn]);

  useEffect(() => {
    const handleVideoDevices = async () => {
      navigator.mediaDevices.enumerateDevices().then((devices) => {
        const videoDevices = devices.filter(
          (device) => device.kind === "videoinput"
        );
        setVideoInputDevices(
          videoDevices.map((device) => ({
            deviceId: device.deviceId,
            deviceName: device.label.toString(),
          }))
        );

        const selectedDeviceName = videoDevices
          .find((device) => device.label.toString().includes("Default"))
          ?.label.toString()
          .replace("Default - ", "");

        const selectedDevice = videoDevices.find(
          (device) => device.label.toString() === selectedDeviceName
        );

        setVideoInputDeviceID(
          selectedDevice?.deviceId || videoDevices[0].deviceId
        );
      });
    };
    handleVideoDevices();
  }, []);

  const handleCameraToggle = (deviceId: string) => {
    if (mediaStream) {
      navigator.mediaDevices
        .getUserMedia({
          video: { deviceId: { exact: deviceId } },
          audio: true,
        })
        .then((stream) => {
          setMediaStream(stream);
          setVideoInputDeviceID(deviceId);
        });
    }
  };

  const handleAudioInputToggle = (deviceId: string) => {
    if (mediaStream) {
      navigator.mediaDevices
        .getUserMedia({
          video: true,
          audio: { deviceId: { exact: deviceId } },
        })
        .then((stream) => {
          setMediaStream(stream);
          setAudioInputDeviceId(deviceId);
        });
    }
  };

  const handleAudioOutputToggle = (deviceId: string) => {};

  const handleMuteToggle = () => {
    setMicOn(!micOn);
  };

  return (
    <div
      className={`absolute bottom-0 left-0 w-full h-[100px] p-5 ${classNames} z-[10]`}
    >
      <div className="flex justify-center items-center h-full relative gap-2.5">
        <Tooltip>
          <TooltipTrigger>
            <div
              className="flex justify-center items-center w-12 h-12 bg-muted rounded-full shadow-lg cursor-pointer"
              onClick={handleMuteToggle}
            >
              {micOn ? <Mic /> : <MicOff />}
            </div>
          </TooltipTrigger>
          <TooltipContent
            className="bg-muted"
            arrowClassName="bg-muted fill-muted"
          >
            {micOn ? "Mute" : "Unmute"}
          </TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger>
            <div
              className="flex justify-center items-center w-12 h-12 bg-red-500 rounded-full shadow-lg cursor-pointer"
              onClick={handleEndCall}
            >
              <PhoneOff />
            </div>
          </TooltipTrigger>
          <TooltipContent
            className="bg-muted"
            arrowClassName="bg-muted fill-muted"
          >
            End Call
          </TooltipContent>
        </Tooltip>

        <div className="absolute left-0 top-[50%] transform -translate-y-1/2 flex gap-2 max-md:hidden">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary">
                Audio Settings <ChevronUp className="size-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-fit">
              <DropdownMenuLabel>Audio input devices</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuRadioGroup
                value={audioInputDeviceId}
                onValueChange={handleAudioInputToggle}
              >
                {audioDevices.map((device) => (
                  <DropdownMenuRadioItem
                    key={device.deviceId}
                    value={device.deviceId}
                  >
                    {device.deviceName}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Audio Output devices</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuRadioGroup
                value={audioOutputDeviceId}
                onValueChange={handleAudioOutputToggle}
              >
                {audioOutputDevices.map((device) => (
                  <DropdownMenuRadioItem
                    key={device.deviceId}
                    value={device.deviceId}
                  >
                    {device.deviceName}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary">
                Video Settings <ChevronUp className="size-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-fit">
              <DropdownMenuLabel>Video input devices</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuRadioGroup
                value={videoInputDeviceID}
                onValueChange={handleCameraToggle}
              >
                {videoInputDevices.map((device) => (
                  <DropdownMenuRadioItem
                    key={device.deviceId}
                    value={device.deviceId}
                  >
                    {device.deviceName}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
};

export default MeetButtonControls;

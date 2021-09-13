import { socket } from "@/socket";
import { voiceChannelModule } from "@/store/modules/voiceChannels";
import Peer from "simple-peer";

// call
export function createPeer(
  channelId: string,
  signalToUserId: string,
  streams?: Array<MediaStream>
) {
  const peer = new Peer({
    initiator: true,
    trickle: true,
    streams
  });
  peer.on("signal", signal => {
    socket.emit("voice:send_signal", { channelId, signalToUserId, signal });
  });
  peer.on("stream", stream => {
    onStream(stream, channelId, signalToUserId);
  });
  peer.on("connect", () => {
    onConnect(channelId, signalToUserId);
  });
  return peer;
}

// accept
export function addPeer(
  channelId: string,
  signalToUserId: string,
  signal: Peer.SignalData,
  streams?: Array<MediaStream>
) {
  const peer = new Peer({
    initiator: false,
    trickle: true,
    streams
  });
  peer.on("signal", signal => {
    socket.emit("voice:send_return_signal", {
      signalToUserId,
      channelId,
      signal
    });
  });
  peer.on("stream", stream => {
    onStream(stream, channelId, signalToUserId);
  });
  peer.on("connect", () => {
    onConnect(channelId, signalToUserId);
  });
  peer.signal(signal);
  return peer;
}

function onConnect(channelId: string, userId: string) {
  voiceChannelModule.update({
    channelId,
    userId,
    update: { connected: true }
  });
  console.log("connected");
}
function onStream(stream: MediaStream, channelId: string, userId: string) {
  const videoTracks = stream.getVideoTracks();
  const streamType = videoTracks.length ? "videoStream" : "audioStream";

  stream.onremovetrack = () => {
    voiceChannelModule.update({
      channelId,
      userId,
      update: { [streamType]: null }
    });
    stream.onremovetrack = null;
  };
  voiceChannelModule.update({
    channelId,
    userId,
    update: { [streamType]: stream }
  });
}

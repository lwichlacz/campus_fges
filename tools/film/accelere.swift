// Remet à vitesse normale le film tourné au ralenti par tools/film/film.js, y pose la musique et l'encode
// (H.264 1920×1080, 30 images par seconde régulières, débit réglé, prêt pour la lecture en continu).
//
// Usage : swift tools/film/accelere.swift <ralenti.mp4> <musique.wav> <sortie.mp4> [ralenti=2] [débit Mb/s=6]
import AVFoundation
import Foundation

let args = CommandLine.arguments
guard args.count >= 4 else { print("Usage : accelere.swift ralenti.mp4 musique.wav sortie.mp4 [ralenti] [débit]"); exit(1) }
let src = URL(fileURLWithPath: args[1]), music = URL(fileURLWithPath: args[2]), dst = URL(fileURLWithPath: args[3])
let factor = args.count > 4 ? Double(args[4])! : 2
let bitrate = Int((args.count > 5 ? Double(args[5])! : 6) * 1_000_000)
let fps: Int32 = 30
try? FileManager.default.removeItem(at: dst)

func track(_ asset: AVURLAsset, _ type: AVMediaType) async throws -> AVAssetTrack {
	guard let t = try await asset.loadTracks(withMediaType: type).first else { throw NSError(domain: "film", code: 1, userInfo: [NSLocalizedDescriptionKey: "piste \(type.rawValue) introuvable"]) }
	return t
}

let videoAsset = AVURLAsset(url: src), audioAsset = AVURLAsset(url: music)
let vTrack = try await track(videoAsset, .video), aTrack = try await track(audioAsset, .audio)
let size = try await vTrack.load(.naturalSize)
let musicDuration = try await audioAsset.load(.duration)

// lecture : images décodées du ralenti, son décodé de la musique
let vReader = try AVAssetReader(asset: videoAsset)
let vOut = AVAssetReaderTrackOutput(track: vTrack, outputSettings: [kCVPixelBufferPixelFormatTypeKey as String: kCVPixelFormatType_32BGRA])
vReader.add(vOut)
let aReader = try AVAssetReader(asset: audioAsset)
let aOut = AVAssetReaderTrackOutput(track: aTrack, outputSettings: [AVFormatIDKey: kAudioFormatLinearPCM, AVLinearPCMBitDepthKey: 16, AVLinearPCMIsFloatKey: false, AVLinearPCMIsBigEndianKey: false, AVLinearPCMIsNonInterleaved: false])
aReader.add(aOut)

// écriture
let writer = try AVAssetWriter(outputURL: dst, fileType: .mp4)
writer.shouldOptimizeForNetworkUse = true
let vIn = AVAssetWriterInput(mediaType: .video, outputSettings: [
	AVVideoCodecKey: AVVideoCodecType.h264, AVVideoWidthKey: Int(size.width), AVVideoHeightKey: Int(size.height),
	AVVideoCompressionPropertiesKey: [AVVideoAverageBitRateKey: bitrate, AVVideoProfileLevelKey: AVVideoProfileLevelH264HighAutoLevel,
		AVVideoMaxKeyFrameIntervalKey: Int(fps)*2, AVVideoExpectedSourceFrameRateKey: Int(fps), AVVideoAllowFrameReorderingKey: true]
])
vIn.expectsMediaDataInRealTime = false
let adaptor = AVAssetWriterInputPixelBufferAdaptor(assetWriterInput: vIn, sourcePixelBufferAttributes: nil)
let aIn = AVAssetWriterInput(mediaType: .audio, outputSettings: [AVFormatIDKey: kAudioFormatMPEG4AAC, AVNumberOfChannelsKey: 2, AVSampleRateKey: 48_000, AVEncoderBitRateKey: 160_000])
aIn.expectsMediaDataInRealTime = false
writer.add(vIn); writer.add(aIn)
guard vReader.startReading(), aReader.startReading(), writer.startWriting() else { print("Lecture ou écriture impossible : \(writer.error?.localizedDescription ?? "")"); exit(1) }
writer.startSession(atSourceTime: .zero)

// vidéo et son écrits en même temps (l'enregistreur attend les deux pistes) : chaque piste avance quand elle est prête
// vidéo : chaque image du ralenti est replacée à son instant divisé par « ralenti » ; on garde une image tous les 1/30 s
let end = musicDuration.seconds
final class State: @unchecked Sendable { var next = 0.0; var written = 0; var last: CVPixelBuffer? = nil; var pending: [CVPixelBuffer] = [] }
let st = State()
let group = DispatchGroup()
let vq = DispatchQueue(label: "video"), aq = DispatchQueue(label: "audio")
group.enter()
vIn.requestMediaDataWhenReady(on: vq) {
	while vIn.isReadyForMoreMediaData {
		if !st.pending.isEmpty {
			adaptor.append(st.pending.removeFirst(), withPresentationTime: CMTime(value: CMTimeValue(st.written), timescale: fps))
			st.written += 1; st.next = Double(st.written)/Double(fps); continue
		}
		if st.next >= end { vIn.markAsFinished(); group.leave(); return }
		if let sb = vOut.copyNextSampleBuffer() {
			guard let pb = CMSampleBufferGetImageBuffer(sb) else { continue }
			let t = CMSampleBufferGetPresentationTimeStamp(sb).seconds/factor
			st.last = pb
			var w = st.written, n = st.next
			while n <= t && n < end { st.pending.append(pb); w += 1; n = Double(w)/Double(fps) }
		} else if let pb = st.last {
			st.pending.append(pb)                // la dernière image tient jusqu'à la fin de la musique
		} else { vIn.markAsFinished(); group.leave(); return }
	}
}
group.enter()
aIn.requestMediaDataWhenReady(on: aq) {
	while aIn.isReadyForMoreMediaData {
		if let sb = aOut.copyNextSampleBuffer() { aIn.append(sb) } else { aIn.markAsFinished(); group.leave(); return }
	}
}
group.wait()
let written = st.written
await writer.finishWriting()
if writer.status != .completed { print("Échec : \(writer.error?.localizedDescription ?? "inconnu")"); exit(1) }
let bytes = (try? FileManager.default.attributesOfItem(atPath: dst.path)[.size] as? Int) ?? 0
print("écrit \(dst.lastPathComponent) · \(written) images à \(fps) i/s · \(String(format: "%.1f", end)) s · \(bytes/1_000_000) Mo")

import { motion, AnimatePresence } from "framer-motion";
import { Eye, ThumbsUp, Calendar, Play, Pause } from "lucide-react";
import { useState } from "react";

interface VideoPreviewProps {
  videoId: string;
  title: string;
  channel: string;
  duration: string;
  views: string;
  likes: string;
  published: string;
  thumbnail: string;
  iframeRef?: React.RefObject<HTMLIFrameElement>;
  compact?: boolean;
}

const VideoPreview = ({ videoId, title, channel, duration, views, likes, published, thumbnail, iframeRef, compact }: VideoPreviewProps) => {
  const [isPlaying, setIsPlaying] = useState(true);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="glass-card rounded-2xl overflow-hidden"
    >
      {/* Full-width video player */}
      <div className={`relative w-full bg-black rounded-t-2xl overflow-hidden ${compact ? "aspect-video" : "aspect-video"}`}>
        <AnimatePresence mode="wait">
          {isPlaying ? (
            <motion.div
              key="player"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full h-full"
            >
              <iframe
                ref={iframeRef}
                src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1&enablejsapi=1`}
                title={title}
                className="w-full h-full border-none"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            </motion.div>
          ) : (
            <motion.div
              key="thumbnail"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="relative w-full h-full group cursor-pointer"
              onClick={() => setIsPlaying(true)}
            >
              <img
                src={thumbnail}
                alt={title}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white shadow-2xl transform transition-all group-hover:scale-110 group-hover:bg-white/30 border border-white/30">
                  <Play className="h-8 w-8 fill-current ml-1" />
                </div>
              </div>
              {duration && (
                <div className="absolute bottom-4 right-4 bg-black/70 backdrop-blur-sm text-white text-sm font-mono font-bold px-3 py-1.5 rounded-lg">
                  {duration}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Video metadata bar */}
      {title && (
        <div className="p-5 border-t border-white/5">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div className="flex-1 min-w-0">
              <h3 className="font-display font-bold text-lg text-foreground leading-tight truncate">{title}</h3>
              {channel && <p className="text-primary font-semibold text-sm mt-1">{channel}</p>}
            </div>
            <div className="flex items-center gap-3 text-muted-foreground text-xs shrink-0 flex-wrap">
              {views && (
                <span className="flex items-center gap-1.5 bg-white/5 px-3 py-1.5 rounded-full">
                  <Eye className="h-3.5 w-3.5" />{views}
                </span>
              )}
              {likes && likes !== "0" && (
                <span className="flex items-center gap-1.5 bg-white/5 px-3 py-1.5 rounded-full">
                  <ThumbsUp className="h-3.5 w-3.5" />{likes}
                </span>
              )}
              {published && (
                <span className="flex items-center gap-1.5 bg-white/5 px-3 py-1.5 rounded-full">
                  <Calendar className="h-3.5 w-3.5" />{published}
                </span>
              )}
              {isPlaying && (
                <button
                  onClick={() => setIsPlaying(false)}
                  className="flex items-center gap-1.5 bg-primary/10 text-primary px-3 py-1.5 rounded-full font-semibold hover:bg-primary/20 transition-colors"
                >
                  <Pause className="h-3.5 w-3.5" /> Hide
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default VideoPreview;

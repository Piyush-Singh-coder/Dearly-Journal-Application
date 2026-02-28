import React from "react";
import { Users } from "lucide-react";

export default function BookCover({ notebook, index, onClick }) {
  // Generate a consistent pseudo-random color based on the notebook ID if no coverImage
  const hue =
    (notebook.id.charCodeAt(0) * 15 + notebook.id.charCodeAt(1) * 30) % 360;
  const isTeam = notebook.type === "team";

  // Base colors for the gradient
  const color1 = isTeam ? `hsl(${hue}, 60%, 40%)` : `hsl(${hue}, 30%, 30%)`;
  const color2 = isTeam
    ? `hsl(${(hue + 30) % 360}, 70%, 25%)`
    : `hsl(${(hue + 20) % 360}, 40%, 15%)`;

  return (
    <div
      className="group perspective-1000 w-full max-w-[200px] cursor-pointer"
      onClick={onClick}
    >
      {/* 3D Transform Container */}
      <div
        className="relative w-full aspect-[1/1.4] transition-all duration-500 transform-style-3d group-hover:rotate-y-minus-15 group-hover:-translate-y-2 group-hover:scale-105"
        style={{
          boxShadow:
            "15px 15px 30px rgba(0,0,0,0.15), -5px 5px 15px rgba(0,0,0,0.05)",
        }}
      >
        {/* Book Spine (Left side) */}
        <div
          className="absolute left-0 top-0 w-8 h-full origin-left transform -rotate-y-90 bg-gradient-to-r"
          style={{
            background: `linear-gradient(to right, ${color2}, ${color1})`,
            boxShadow: "inset -2px 0 5px rgba(0,0,0,0.3)",
          }}
        >
          {/* Subtle spine texture */}
          <div className="absolute inset-x-0 top-4 h-[1px] bg-white/20"></div>
          <div className="absolute inset-x-0 bottom-4 h-[1px] bg-white/20"></div>
        </div>

        {/* Front Cover */}
        <div
          className="absolute inset-0 w-full h-full rounded-r-lg overflow-hidden transform translate-z-px bg-slate-800"
          style={{
            background: notebook.coverImage
              ? `url(${notebook.coverImage}) center/cover`
              : `linear-gradient(135deg, ${color1}, ${color2})`,
            boxShadow: "inset 4px 0 10px rgba(0,0,0,0.2)",
          }}
        >
          {/* Cover Overlay & Content */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/40 flex flex-col justify-between p-5">
            {/* Top Badge */}
            <div className="flex justify-end">
              {isTeam ? (
                <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center -mr-1 -mt-1 shadow-sm border border-white/10">
                  <Users className="w-4 h-4 text-white drop-shadow-md" />
                </div>
              ) : (
                <div className="w-8 h-8 flex items-center justify-center -mr-1 -mt-1 opacity-50">
                  <div className="w-1.5 h-1.5 rounded-full bg-white/60 shadow-[0_4px_0_rgba(255,255,255,0.6),0_8px_0_rgba(255,255,255,0.6)]"></div>
                </div>
              )}
            </div>

            {/* Title & Volume */}
            <div>
              <h3 className="text-white font-black text-xl leading-tight mb-2.5 drop-shadow-md line-clamp-3">
                {notebook.title}
              </h3>
              <div className="w-6 h-1 bg-amber-400 mb-2 rounded-full shadow-[0_0_10px_rgba(251,191,36,0.5)]"></div>
              <p className="text-white/80 text-[10px] font-bold uppercase tracking-widest drop-shadow-sm">
                Vol. {index + 1}
              </p>
            </div>
          </div>

          {/* Glare effect on hover */}
          <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/0 to-white/0 group-hover:via-white/30 transition-all duration-700 transform -translate-x-full group-hover:translate-x-full"></div>
        </div>

        {/* Book Pages (Right edge) */}
        <div
          className="absolute right-0 top-[2%] w-4 h-[96%] origin-right transform rotate-y-90 bg-slate-100 flex flex-col justify-between"
          style={{
            backgroundImage:
              "repeating-linear-gradient(to bottom, #cbd5e1 0px, #cbd5e1 1px, #f8fafc 1px, #f8fafc 3px)",
          }}
        ></div>
      </div>

      {/* Shelf shadow projection below the book */}
      <div className="w-[85%] h-5 mx-auto mt-2 bg-black/20 blur-md rounded-[100%] transition-all duration-500 group-hover:blur-xl group-hover:scale-95 group-hover:opacity-40 translate-y-2 group-hover:translate-y-4"></div>
    </div>
  );
}

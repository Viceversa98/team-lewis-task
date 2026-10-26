type LandmarkSketchProps = {
  className?: string;
};

export const LandmarkSketch = ({ className }: LandmarkSketchProps) => (
  <svg viewBox="0 0 240 300" aria-hidden="true" className={className} fill="none">
    <path
      d="M78 300 C72 236 84 214 104 198 C96 186 92 170 92 154 C92 128 104 108 120 108 C136 108 148 128 148 154 C148 170 144 186 136 198 C156 214 168 236 162 300 Z"
      className="fill-cyanotype/40"
    />
  </svg>
);

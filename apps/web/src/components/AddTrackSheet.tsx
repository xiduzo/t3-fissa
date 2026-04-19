import { type FC } from "react";

interface AddTrackSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddTrackSheet: FC<AddTrackSheetProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/50"
        onClick={onClose}
        aria-hidden="true"
      />
      {/* Sheet */}
      <div
        data-testid="add-track-sheet"
        role="dialog"
        aria-modal="true"
        aria-label="Add Track"
        className="fixed bottom-0 left-0 right-0 z-50 rounded-t-2xl bg-background p-6 shadow-lg"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Add Track</h2>
          <button
            data-testid="add-track-sheet-close"
            type="button"
            onClick={onClose}
            className="rounded-full p-2 hover:bg-accent"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        {/* Search UI — future task */}
      </div>
    </>
  );
};

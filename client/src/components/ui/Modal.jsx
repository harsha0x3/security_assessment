const Modal = ({ open, onClose, title, children }) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
      <div
        className="
          bg-white rounded-lg shadow-lg w-full max-w-md
          max-h-[90vh] flex flex-col
        "
      >
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-lg font-bold">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-800"
          >
            ✕
          </button>
        </div>

        {/* Content (scrollable) */}
        <div className="p-4 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
};

export default Modal;

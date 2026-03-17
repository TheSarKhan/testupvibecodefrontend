import { Fragment } from 'react';
import { HiX } from 'react-icons/hi';

const Modal = ({ isOpen, onClose, title, children, maxWidth = "max-w-md", closeOnBackdrop = true }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-screen items-center justify-center p-4 text-center sm:p-0">

                {/* Backdrop */}
                <div
                    className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm transition-opacity"
                    onClick={closeOnBackdrop ? onClose : undefined}
                    aria-hidden="true"
                ></div>

                {/* Modal Panel */}
                <div className={`relative flex flex-col transform rounded-2xl bg-white text-left shadow-xl transition-all sm:my-8 w-full max-h-[95vh] ${maxWidth}`}>

                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
                        <h3 className="text-xl font-bold text-gray-900">
                            {title}
                        </h3>
                        <button
                            type="button"
                            className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500 transition-colors"
                            onClick={onClose}
                        >
                            <span className="sr-only">Kapat</span>
                            <HiX className="h-5 w-5" aria-hidden="true" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="px-6 py-6 overflow-y-auto overflow-x-hidden">
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Modal;

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { HiOutlineDocumentText, HiOutlineTemplate, HiOutlineArrowRight } from 'react-icons/hi';
import Modal from './Modal';
import api from '../../api/axios';

const CreateExamModal = ({ isOpen, onClose }) => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [examType, setExamType] = useState(null);
    const [selectedSubject, setSelectedSubject] = useState('');
    const [subjects, setSubjects] = useState([]);

    useEffect(() => {
        api.get('/subjects').then(res => setSubjects(res.data)).catch(() => {});
    }, []);

    const handleTypeSelect = (type) => {
        if (type === 'template') return;
        setExamType(type);
        setStep(2);
    };

    const handleContinue = () => {
        if (!selectedSubject) return;
        onClose();
        setTimeout(() => {
            setStep(1);
            setExamType(null);
            setSelectedSubject('');
        }, 300);
        navigate('/imtahanlar/yarat', { state: { subject: selectedSubject, type: examType } });
    };

    const renderStep1 = () => (
        <div className="space-y-4">
            <p className="text-gray-600 mb-6">Yaratmaq istədiyiniz imtahan növünü seçin:</p>

            <button
                onClick={() => handleTypeSelect('free')}
                className="w-full text-left p-5 rounded-xl border-2 border-indigo-100 hover:border-indigo-500 bg-white hover:bg-indigo-50/50 transition-all flex items-start gap-4 group"
            >
                <div className="p-3 bg-indigo-100 text-indigo-600 rounded-lg group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                    <HiOutlineDocumentText className="w-6 h-6" />
                </div>
                <div>
                    <h4 className="text-lg font-bold text-gray-900">Sərbəst İmtahan</h4>
                    <p className="text-gray-500 text-sm mt-1">Öz suallarınızı sıfırdan yaradaraq test tərtib edin.</p>
                </div>
            </button>

            <button
                onClick={() => handleTypeSelect('template')}
                className="w-full text-left p-5 rounded-xl border-2 border-gray-100 bg-gray-50 opacity-70 cursor-not-allowed flex items-start gap-4 relative overflow-hidden"
            >
                <div className="absolute top-3 right-3 bg-gray-200 text-gray-500 text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider">
                    Tezliklə
                </div>
                <div className="p-3 bg-gray-200 text-gray-500 rounded-lg">
                    <HiOutlineTemplate className="w-6 h-6" />
                </div>
                <div>
                    <h4 className="text-lg font-bold text-gray-900">Şablon Əsasında</h4>
                    <p className="text-gray-500 text-sm mt-1">Əvvəlcədən təyin edilmiş struktura uyğun sual bankından test.</p>
                </div>
            </button>
        </div>
    );

    const renderStep2 = () => (
        <div className="space-y-6">
            <div>
                <button onClick={() => setStep(1)} className="text-sm font-medium text-indigo-600 hover:text-indigo-800 mb-4 inline-block">
                    ← Geriyə qayıt
                </button>
                <p className="text-gray-600">Sərbəst imtahan üçün fənn seçin:</p>
            </div>

            <div className="grid grid-cols-2 gap-3 max-h-64 overflow-y-auto p-1">
                {subjects.map((name) => (
                    <button
                        key={name}
                        onClick={() => setSelectedSubject(name)}
                        className={`p-3 rounded-lg border text-sm font-medium transition-all text-left ${
                            selectedSubject === name
                                ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-sm'
                                : 'border-gray-200 bg-white text-gray-700 hover:border-indigo-300 hover:bg-gray-50'
                        }`}
                    >
                        {name}
                    </button>
                ))}
            </div>

            <div className="pt-4 border-t border-gray-100 flex justify-end">
                <button
                    onClick={handleContinue}
                    disabled={!selectedSubject}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-6 py-2.5 rounded-xl font-semibold transition-colors"
                >
                    Davam et
                    <HiOutlineArrowRight className="w-5 h-5" />
                </button>
            </div>
        </div>
    );

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={step === 1 ? "Yeni İmtahan Növü" : "Fənn Seçimi"} maxWidth="max-w-lg">
            {step === 1 ? renderStep1() : renderStep2()}
        </Modal>
    );
};

export default CreateExamModal;

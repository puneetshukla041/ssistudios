"use client";
import { useRouter } from 'next/navigation';
import React, { useState, useEffect, FC } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Plus,
    X,
    Calendar,
    User,
    Maximize2,
    HardDrive,
    AlertCircle,
    Eye,
    Trash2,
    Search,
    Archive,
    Loader2
} from "lucide-react";
import toast, { Toaster } from 'react-hot-toast';

// --- TYPES ---
interface Template {
    _id: string;
    templateName: string;
    imageUrl: string;
    description: string;
    tags: string[];
    dimensions: { width: number; height: number };
    fileSize: string;
    uploadedBy: string;
    createdAt: string;
}

// --- MOCK DATA & API ---
const createMockTemplates = (count: number): Template[] => {
    return Array.from({ length: count }, (_, i) => ({
        _id: `template_${i + 1}`,
        templateName: `Corporate Flyer ${i + 1}`,
        imageUrl: `https://placehold.co/600x400/EEE/31343C?text=Template+${i + 1}`,
        description: "A professionally designed template providing a clear, concise, and visually engaging format for your needs.",
        tags: ["Business", "Corporate", "Modern", "Flyer"],
        dimensions: { width: 1920, height: 1080 },
        fileSize: `${(Math.random() * 5 + 1).toFixed(1)} MB`,
        uploadedBy: "Admin User",
        createdAt: new Date(Date.now() - Math.random() * 1e10).toISOString(),
    }));
};

let mockTemplates = createMockTemplates(12);

// --- UTILS ---
const FALLBACK_IMAGE = "https://placehold.co/600x400/EEE/31343C?text=No+Image";

type InfoPillProps = {
    icon: React.ReactNode;
    text: string;
};

const InfoPill: FC<InfoPillProps> = ({ icon, text }) => (
    <div className="flex items-center gap-2 bg-zinc-100 text-zinc-700 text-xs px-3 py-1 rounded-md font-medium">
        {icon} <span>{text}</span>
    </div>
);

// --- MODAL PROPS TYPE ---
interface TemplateDetailModalProps {
    template: Template | null;
    onClose: () => void;
    onDelete: (templateId: string) => Promise<void>;
}

// --- MODAL COMPONENT ---
const TemplateDetailModal: FC<TemplateDetailModalProps> = ({ template, onClose, onDelete }) => {
    const [isConfirmingDelete, setIsConfirmingDelete] = useState<boolean>(false);
    const [isDeleting, setIsDeleting] = useState<boolean>(false);
    const router = useRouter();

    useEffect(() => {
        if (template) {
            setIsConfirmingDelete(false);
            setIsDeleting(false);
        }
    }, [template]);

    if (!template) return null;

    const handleConfirmDelete = async () => {
        setIsDeleting(true);
        await onDelete(template._id);
    };

    const confirmationAnimation = {
        initial: { opacity: 0, y: 10 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -10 },
        transition: { duration: 0.2 },
    };

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                    className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col md:flex-row overflow-hidden cursor-default"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* IMAGE SECTION */}
                    <div className="w-full md:w-1/2 bg-zinc-50 flex items-center justify-center p-6 relative">
                        <AnimatePresence>
                            {isDeleting && (
                                <motion.div
                                    key="deleting-overlay"
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className="absolute inset-0 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center z-10"
                                >
                                    <Loader2 className="h-12 w-12 text-zinc-500 animate-spin" />
                                    <p className="mt-4 text-zinc-600 font-medium">Deleting Template...</p>
                                </motion.div>
                            )}
                        </AnimatePresence>
                        <motion.img
                            layoutId={`card-image-${template._id}`}
                            src={template.imageUrl || FALLBACK_IMAGE}
                            alt={template.templateName}
                            className="max-w-full max-h-full object-contain rounded-xl shadow-inner"
                        />
                    </div>

                    {/* DETAILS SECTION */}
                    <div className="w-full md:w-1/2 p-8 flex flex-col overflow-y-auto">
                        <div className="flex justify-between items-start mb-3">
                            <h2 className="text-2xl font-bold text-zinc-800">{template.templateName}</h2>
                            <motion.button
                                whileHover={{ scale: 1.1, rotate: 90 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={onClose}
                                className="p-2 rounded-full text-zinc-500 hover:bg-zinc-100 transition-colors cursor-pointer"
                            >
                                <X size={20} />
                            </motion.button>
                        </div>

                        <p className="text-sm text-zinc-600 mb-6">{template.description}</p>

                        <div className="flex flex-wrap gap-2 mb-6">
                            {(template.tags || []).map((tag) => (
                                <span key={tag} className="bg-blue-100 text-blue-800 text-xs font-semibold px-3 py-1 rounded-full">
                                    {tag}
                                </span>
                            ))}
                        </div>

                        <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">Details</h3>
                        <div className="flex flex-wrap gap-2">
                            <InfoPill icon={<User size={12} />} text={template.uploadedBy} />
                            <InfoPill icon={<Calendar size={12} />} text={new Date(template.createdAt).toLocaleDateString()} />
                            <InfoPill icon={<Maximize2 size={12} />} text={`${template.dimensions.width}x${template.dimensions.height}px`} />
                            <InfoPill icon={<HardDrive size={12} />} text={template.fileSize} />
                        </div>

                        {/* ACTION BUTTONS */}
                        <div className="mt-auto pt-8">
                            <AnimatePresence mode="wait">
                                {isConfirmingDelete ? (
                                    <motion.div key="confirm" {...confirmationAnimation}>
                                        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-center">
                                            <p className="text-sm font-semibold text-red-800">Are you sure?</p>
                                            <div className="mt-3 flex gap-2">
                                                <motion.button
                                                    whileTap={{ scale: 0.97 }}
                                                    onClick={handleConfirmDelete}
                                                    className="w-full bg-red-600 text-white text-sm font-semibold py-2 px-3 rounded-md hover:bg-red-700 transition-colors cursor-pointer"
                                                >
                                                    Confirm Delete
                                                </motion.button>
                                                <motion.button
                                                    whileTap={{ scale: 0.97 }}
                                                    onClick={() => setIsConfirmingDelete(false)}
                                                    className="w-full bg-zinc-200 text-zinc-800 text-sm font-semibold py-2 px-3 rounded-md hover:bg-zinc-300 transition-colors cursor-pointer"
                                                >
                                                    Cancel
                                                </motion.button>
                                            </div>
                                        </div>
                                    </motion.div>
                                ) : (
                                    <motion.div key="actions" {...confirmationAnimation}>
                                        <div className="flex flex-col sm:flex-row gap-2">
                                            <motion.button
                                                whileTap={{ scale: 0.97 }}
                                                onClick={() => {
                                                    if (template._id === "admin_welcome") {
                                                        router.push("/poster/editor/poster1editor");
                                                    } else {
                                                        toast(`Using template: ${template.templateName}`);
                                                    }
                                                }}
                                                className="w-full bg-zinc-800 text-white font-semibold py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 hover:bg-black transition-colors cursor-pointer text-sm"
                                            >
                                                <Plus size={16} /> Use Template
                                            </motion.button>

                                            {!template._id.startsWith("admin_") && (
                                                <motion.button
                                                    whileTap={{ scale: 0.97 }}
                                                    onClick={() => setIsConfirmingDelete(true)}
                                                    className="w-full sm:w-auto bg-zinc-100 text-zinc-700 font-semibold py-2.5 px-3 rounded-lg flex items-center justify-center gap-2 hover:bg-zinc-200 transition-colors cursor-pointer"
                                                >
                                                    <Trash2 size={16} />
                                                </motion.button>
                                            )}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

// --- CARD ---
type DesignCardProps = {
    template: Template;
    onCardClick: (template: Template) => void;
};

const DesignCard: FC<DesignCardProps> = ({ template, onCardClick }) => (
    <div
        onClick={() => onCardClick(template)}
        className="group relative overflow-hidden rounded-xl bg-zinc-100 border border-zinc-200 shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1.5 cursor-pointer"
    >
        <div className="overflow-hidden">
            <motion.img
                layoutId={`card-image-${template._id}`}
                src={template.imageUrl || FALLBACK_IMAGE}
                alt={template.templateName}
                className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-105"
            />
        </div>
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center p-4">
            <div className="bg-white/90 backdrop-blur-sm text-zinc-900 font-semibold px-4 py-2 rounded-full flex items-center gap-2 text-sm">
                <Eye size={16} />
                <span>View</span>
            </div>
        </div>
        <div className="p-4 bg-white">
            <h3 className="font-semibold text-sm text-zinc-800 truncate">{template.templateName}</h3>
            <div className="flex flex-wrap gap-1.5 mt-2">
                {template.tags.slice(0, 2).map((tag) => (
                    <span key={tag} className="text-xs bg-zinc-100 text-zinc-600 px-2 py-0.5 rounded-md font-medium">
                        {tag}
                    </span>
                ))}
            </div>
        </div>
    </div>
);

// --- SKELETON ---
const TemplateSkeleton: FC = () => (
    <div className="rounded-xl bg-zinc-100 border border-zinc-200 overflow-hidden animate-pulse">
        <div className="w-full h-48 bg-zinc-200"></div>
        <div className="p-4 space-y-3">
            <div className="h-4 bg-zinc-200 rounded w-3/4"></div>
            <div className="flex gap-2">
                <div className="h-4 bg-zinc-200 rounded-full w-12"></div>
                <div className="h-4 bg-zinc-200 rounded-full w-16"></div>
            </div>
        </div>
    </div>
);

// --- MAIN COMPONENT ---
export default function App() {
    const [newTemplates, setNewTemplates] = useState<Template[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
    const [searchQuery, setSearchQuery] = useState<string>("");

    const [adminTemplate, setAdminTemplate] = useState<Template | null>(null);

    useEffect(() => {
        const img = new Image();
        img.src = "/posters/poster1.jpg";
        img.onload = () => {
            const width = img.width;
            const height = img.height;
            setAdminTemplate({
                _id: "admin_welcome",
                templateName: "Welcome Template",
                imageUrl: "/posters/poster1.jpg",
                description: "This is the admin's featured choice template.",
                tags: ["Admin Choice", "Featured"],
                dimensions: { width, height },
                fileSize: "1.5 MB",
                uploadedBy: "Admin",
                createdAt: new Date().toISOString(),
            });
        };
    }, []);

    useEffect(() => {
        async function fetchTemplates() {
            try {
                const response = await fetch("/api/templates");
                if (!response.ok) throw new Error("Could not fetch templates from the server.");
                const data = await response.json();
                
                const enhancedData: Template[] = data.data.map((t: any) => ({
                    ...t,
                    imageUrl: t.imageUrl || "",
                    description: "A professionally designed template providing a clear, concise, and visually engaging format for your needs.",
                    tags: ["Business", "Corporate", "Modern"],
                    dimensions: { width: 1920, height: 1080 },
                    fileSize: "2.5 MB",
                    uploadedBy: "Admin User",
                    createdAt: t.createdAt || new Date(Date.now() - Math.random() * 1e10).toISOString(),
                }));
                setNewTemplates(enhancedData);
            } catch (err) {
                if (err instanceof Error) setError(err.message);
                else setError("An unknown error occurred.");
            } finally {
                setIsLoading(false);
            }
        };
        fetchTemplates();
    }, []);

    const handleDeleteTemplate = async (templateId: string) => {
        const promise = fetch(`/api/templates/${templateId}`, { method: 'DELETE' });

        toast.promise(promise, {
            loading: 'Deleting template...',
            success: (res) => {
                if (!res.ok) throw new Error('Failed to delete. Please try again.');
                setNewTemplates((prev) => prev.filter((t) => t._id !== templateId));
                setSelectedTemplate(null);
                return 'Template deleted successfully!';
            },
            error: (err) => err.message || 'An unknown error occurred.',
        });
    };

    const filteredTemplates = newTemplates.filter(template =>
        template.templateName.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <section className="max-w-7xl mx-auto">
            <Toaster position="top-center" reverseOrder={false} />
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-zinc-800">Template Library</h2>
                    <p className="text-sm text-zinc-500 mt-1">Browse, select, and start creating your next project.</p>
                </div>
                <div className="flex items-center gap-2 w-full md:w-auto">
                    <div className="relative w-full md:w-64">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search templates..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-zinc-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        />
                    </div>
                    <a href="/poster/upload" className="bg-zinc-800 text-white font-semibold py-2 px-4 rounded-lg flex items-center justify-center gap-2 hover:bg-black transition-colors cursor-pointer text-sm shrink-0">
                        <Plus size={16} /> Add New
                    </a>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                <AnimatePresence>
                    {isLoading
                        ? [...Array(8)].map((_, i) => <TemplateSkeleton key={i} />)
                        : error
                        ? (
                            <div className="col-span-full text-center py-10 px-4 rounded-xl bg-red-50 border border-red-200 text-red-800">
                                <AlertCircle className="mx-auto h-10 w-10 text-red-400" />
                                <h3 className="mt-3 text-base font-semibold">An Error Occurred</h3>
                                <p className="mt-1 text-sm">{error}</p>
                            </div>
                        )
                        : (
                            <>
                                {adminTemplate && (
                                    <motion.div
                                        key={adminTemplate._id}
                                        layout
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.8 }}
                                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                                    >
                                        <DesignCard template={adminTemplate} onCardClick={setSelectedTemplate} />
                                    </motion.div>
                                )}
                                {filteredTemplates.map((template) => (
                                    <motion.div
                                        key={template._id}
                                        layout
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.8 }}
                                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                                    >
                                        <DesignCard template={template} onCardClick={setSelectedTemplate} />
                                    </motion.div>
                                ))}
                            </>
                        )
                    }
                </AnimatePresence>
            </div>

            <AnimatePresence>
                {selectedTemplate && (
                    <TemplateDetailModal
                        template={selectedTemplate}
                        onClose={() => setSelectedTemplate(null)}
                        onDelete={handleDeleteTemplate}
                    />
                )}
            </AnimatePresence>
        </section>
    );
}

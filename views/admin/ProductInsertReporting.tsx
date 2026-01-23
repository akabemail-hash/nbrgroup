
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAppContext } from '../../contexts/AppContext';
import { supabase } from '../../services/supabase';
import { ProductInsert, Customer } from '../../types';
import { Loader2, ChevronLeft, ChevronRight, X, CheckSquare, Square, ChevronDown } from 'lucide-react';

const ITEMS_PER_PAGE = 6;

const ReportCard: React.FC<{ insert: ProductInsert, onImageClick: (url: string) => void }> = ({ insert, onImageClick }) => {
    const { t } = useAppContext();
    return (
        <div className="bg-surface dark:bg-dark-surface rounded-lg shadow-md border border-border dark:border-dark-border p-4 flex flex-col space-y-3">
            <div>
                <h3 className="font-bold text-lg text-text-primary dark:text-dark-text-primary">{insert.customer?.name}</h3>
                <div className="flex justify-between items-center mt-1">
                     <p className="text-sm text-primary dark:text-dark-primary font-medium">{insert.product_name}</p>
                     <p className="text-sm font-bold text-text-primary dark:text-dark-text-primary">{insert.insert_price.toFixed(2)}</p>
                </div>
                <div className="text-xs text-text-secondary dark:text-dark-text-secondary mt-1 space-y-0.5">
                     <p>{t('productInsert.startDate')}: {new Date(insert.start_date).toLocaleDateString()}</p>
                     <p>{t('productInsert.endDate')}: {new Date(insert.end_date).toLocaleDateString()}</p>
                </div>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-2">
                {insert.photo_urls && insert.photo_urls.length > 0 ? (
                    insert.photo_urls.map((url, index) => (
                         <img key={index} src={url} onClick={() => onImageClick(url)} alt={`Insert ${index+1}`} className="w-full h-24 object-cover rounded-md cursor-pointer hover:opacity-80 border border-border dark:border-dark-border"/>
                    ))
                ) : (
                    <div className="col-span-2 h-24 bg-gray-100 dark:bg-gray-800 rounded-md flex items-center justify-center text-gray-400 text-xs">No Photos</div>
                )}
            </div>
        </div>
    );
};

const MultiSelectDropdown: React.FC<{
    options: Customer[];
    selectedIds: Set<string>;
    onChange: (id: string) => void;
    label: string;
}> = ({ options, selectedIds, onChange, label }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const selectedCount = selectedIds.size;

    return (
        <div className="relative" ref={dropdownRef}>
            <label className="block text-sm font-medium mb-1">{label}</label>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full p-2 bg-transparent border border-border dark:border-dark-border rounded-md text-left flex justify-between items-center text-sm"
            >
                <span className="truncate">
                    {selectedCount === 0 ? 'All Customers' : `${selectedCount} Selected`}
                </span>
                <ChevronDown className="h-4 w-4" />
            </button>
            
            {isOpen && (
                <div className="absolute z-10 w-full bg-surface dark:bg-dark-surface border border-border dark:border-dark-border rounded-md mt-1 max-h-60 overflow-y-auto shadow-lg p-2">
                    {options.map(option => (
                        <div
                            key={option.id}
                            onClick={() => onChange(option.id)}
                            className="flex items-center gap-2 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer rounded-md"
                        >
                            {selectedIds.has(option.id) ? <CheckSquare className="h-4 w-4 text-primary" /> : <Square className="h-4 w-4 text-gray-400" />}
                            <span className="text-sm truncate">{option.name}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

const ProductInsertReporting: React.FC = () => {
    const { t, permissions, showNotification } = useAppContext();
    const pagePermissions = permissions['Product Insert Reporting'];

    const [inserts, setInserts] = useState<ProductInsert[]>([]);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [loading, setLoading] = useState(true);
    const [totalCount, setTotalCount] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [viewingImage, setViewingImage] = useState<string | null>(null);

    // Filters
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [selectedCustomerIds, setSelectedCustomerIds] = useState<Set<string>>(new Set());

    const fetchInitialData = useCallback(async () => {
        try {
            const { data, error } = await supabase.from('customers').select('id, name').order('name');
            if (error) throw error;
            setCustomers(data as Customer[] || []);
        } catch (error: any) {
            showNotification(`Failed to load customers: ${error.message}`, 'error');
        }
    }, [showNotification]);

    const fetchInserts = useCallback(async () => {
        if (!pagePermissions?.can_view) {
            setLoading(false);
            return;
        }
        setLoading(true);
        try {
            let query = supabase
                .from('product_inserts')
                .select('*, customer:customers(name)', { count: 'exact' });

            // Filter Logic
            // Start Date Filter: Show inserts ending ON or AFTER selected start date
            if (startDate) query = query.gte('end_date', startDate);
            // End Date Filter: Show inserts starting ON or BEFORE selected end date
            if (endDate) query = query.lte('start_date', endDate);
            
            if (selectedCustomerIds.size > 0) {
                query = query.in('customer_id', Array.from(selectedCustomerIds));
            }

            const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
            query = query.range(startIndex, startIndex + ITEMS_PER_PAGE - 1).order('created_at', { ascending: false });

            const { data, error, count } = await query;
            if (error) throw error;

            setInserts((data as any) || []);
            setTotalCount(count || 0);

        } catch (error: any) {
            showNotification(`Failed to load reports: ${error.message}`, 'error');
        } finally {
            setLoading(false);
        }
    }, [pagePermissions, showNotification, currentPage, startDate, endDate, selectedCustomerIds]);

    useEffect(() => {
        fetchInitialData();
    }, [fetchInitialData]);

    useEffect(() => {
        fetchInserts();
    }, [fetchInserts]);

    const handleCustomerToggle = (id: string) => {
        const newSet = new Set(selectedCustomerIds);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setSelectedCustomerIds(newSet);
        setCurrentPage(1); // Reset to first page on filter change
    };

    const handleResetFilters = () => {
        setStartDate('');
        setEndDate('');
        setSelectedCustomerIds(new Set());
        setCurrentPage(1);
    };

    const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

    if (!pagePermissions?.can_view) return <p>{t('error.accessDenied.message')}</p>;

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold">{t('productInsertReporting.title')}</h1>

            <div className="p-4 bg-surface dark:bg-dark-surface rounded-lg shadow-md border border-border dark:border-dark-border space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">{t('productInsertReporting.filterByDate')}</label>
                        <div className="flex items-center gap-2">
                             <input type="date" value={startDate} onChange={e => { setStartDate(e.target.value); setCurrentPage(1); }} className="w-full p-2 bg-transparent border border-border dark:border-dark-border rounded-md text-sm" />
                             <input type="date" value={endDate} onChange={e => { setEndDate(e.target.value); setCurrentPage(1); }} className="w-full p-2 bg-transparent border border-border dark:border-dark-border rounded-md text-sm" />
                        </div>
                    </div>
                    <div>
                        <MultiSelectDropdown 
                            options={customers} 
                            selectedIds={selectedCustomerIds} 
                            onChange={handleCustomerToggle} 
                            label={t('productInsertReporting.filterByCustomer')}
                        />
                    </div>
                </div>
                <div className="flex justify-end gap-2">
                    <button onClick={handleResetFilters} className="px-4 py-2 text-sm font-medium rounded-md border border-border dark:border-dark-border hover:bg-gray-100 dark:hover:bg-gray-800">{t('visitRequestReport.filters.reset')}</button>
                </div>
            </div>

             {loading ? <div className="text-center p-8"><Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" /></div> :
             inserts.length === 0 ? <p className="text-center py-8 text-text-secondary">{t('productInsertReporting.noResults')}</p> :
             (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {inserts.map(i => <ReportCard key={i.id} insert={i} onImageClick={setViewingImage}/>)}
                    </div>
                    {totalPages > 1 && (
                         <div className="flex items-center justify-between p-4">
                            <span className="text-sm text-text-secondary">{t('pagination.page').replace('{currentPage}', String(currentPage)).replace('{totalPages}', String(totalPages))} ({totalCount} results)</span>
                            <div className="flex items-center gap-2">
                                <button onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 1} className="p-2 rounded-md border disabled:opacity-50"><ChevronLeft className="h-4 w-4" /></button>
                                <button onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage === totalPages} className="p-2 rounded-md border disabled:opacity-50"><ChevronRight className="h-4 w-4" /></button>
                            </div>
                        </div>
                    )}
                </>
             )
            }

            {viewingImage && (
                <div className="fixed inset-0 bg-black bg-opacity-80 z-[100] flex items-center justify-center p-4" onClick={() => setViewingImage(null)}>
                    <img src={viewingImage} alt="Insert" className="max-w-full max-h-full rounded-lg shadow-lg" />
                    <button className="absolute top-4 right-4 p-2 bg-white/20 rounded-full text-white hover:bg-white/40"><X/></button>
                </div>
            )}
        </div>
    );
};

export default ProductInsertReporting;
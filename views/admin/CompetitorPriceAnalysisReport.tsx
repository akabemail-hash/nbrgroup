
import React, { useState, useEffect, useCallback } from 'react';
import { useAppContext } from '../../contexts/AppContext';
import { supabase } from '../../services/supabase';
import { CompetitorPriceAnalysis, Product, Customer } from '../../types';
import { Loader2, ChevronLeft, ChevronRight, X, Image as ImageIcon } from 'lucide-react';

const ITEMS_PER_PAGE = 5;

const ReportCard: React.FC<{ report: CompetitorPriceAnalysis; onImageClick: (url: string) => void }> = ({ report, onImageClick }) => {
    const { t } = useAppContext();
    return (
        <div className="bg-surface dark:bg-dark-surface rounded-lg shadow-md border border-border dark:border-dark-border p-4 flex flex-col space-y-3">
            <div>
                <p className="text-sm font-semibold text-text-secondary dark:text-dark-text-secondary">{new Date(report.analysis_date).toLocaleString()}</p>
                <h3 className="font-bold text-lg text-text-primary dark:text-dark-text-primary">{report.customer?.name || report.store_name}</h3>
                {report.description && <p className="text-sm italic mt-1">"{report.description}"</p>}
            </div>
            <div className="border-t border-border dark:border-dark-border pt-2">
                <h4 className="font-semibold mb-2">{t('competitorPriceAnalysis.items')}</h4>
                <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                        <thead className="text-left text-xs text-text-secondary dark:text-dark-text-secondary">
                            <tr>
                                <th className="pb-2">{t('competitorPriceAnalysis.product')}</th>
                                <th className="pb-2 text-center">{t('competitorPriceAnalysis.productPrice')}</th>
                                <th className="pb-2">{t('competitorPriceAnalysis.competitorProductName')}</th>
                                <th className="pb-2 text-center">{t('competitorPriceAnalysis.competitorPrice')}</th>
                                <th className="pb-2 text-center">{t('competitorPriceAnalysis.photo')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {report.items?.map(item => (
                                <tr key={item.id} className="border-b border-border dark:border-dark-border last:border-b-0">
                                    <td className="py-2">{item.product?.name}</td>
                                    {/* Use stored product_price if available (historical), otherwise fallback to current catalog price */}
                                    <td className="py-2 text-center">
                                        {(item.product_price !== undefined && item.product_price !== null) 
                                            ? item.product_price.toFixed(2) 
                                            : item.product?.price.toFixed(2)}
                                    </td>
                                    <td className="py-2">{item.competitor_product_name || t('common.na')}</td>
                                    <td className="py-2 text-center">{item.competitor_price.toFixed(2)}</td>
                                    <td className="py-2 text-center">
                                        {item.photo_url ? (
                                            <img src={item.photo_url} onClick={() => onImageClick(item.photo_url!)} alt="Competitor" className="h-10 w-10 object-cover rounded cursor-pointer mx-auto"/>
                                        ) : <ImageIcon className="h-5 w-5 text-gray-400 mx-auto"/>}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};


const CompetitorPriceAnalysisReport: React.FC = () => {
    const { t, permissions, showNotification } = useAppContext();
    const pagePermissions = permissions['Competitor Price Analysis Report'];
    const [reports, setReports] = useState<CompetitorPriceAnalysis[]>([]);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [allProducts, setAllProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [totalCount, setTotalCount] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [viewingImage, setViewingImage] = useState<string | null>(null);

    const initialFilters = { startDate: '', endDate: '', customerId: '', productIds: new Set<string>() };
    const [filters, setFilters] = useState(initialFilters);
    
    const fetchDropdownData = useCallback(async () => {
        try {
            const customersPromise = supabase.from('customers').select('*').order('name');
            const productsPromise = supabase.from('products').select('*').order('name');
            const [{ data: customersData }, { data: productsData }] = await Promise.all([customersPromise, productsPromise]);
            
            setCustomers(customersData as Customer[] || []);
            setAllProducts(productsData as Product[] || []);
        } catch (error: any) {
            showNotification(`Failed to load filter data: ${error.message}`, 'error');
        }
    }, [showNotification]);

    const fetchReports = useCallback(async (page: number, currentFilters: typeof filters) => {
        if (!pagePermissions?.can_view) {
            setLoading(false);
            return;
        }
        setLoading(true);
        try {
            let analysisIdsQuery = supabase.from('competitor_price_analysis').select('id', { count: 'exact' });
            
            if (currentFilters.startDate) analysisIdsQuery = analysisIdsQuery.gte('analysis_date', `${currentFilters.startDate}T00:00:00.000Z`);
            if (currentFilters.endDate) analysisIdsQuery = analysisIdsQuery.lte('analysis_date', `${currentFilters.endDate}T23:59:59.999Z`);
            if (currentFilters.customerId) analysisIdsQuery = analysisIdsQuery.eq('customer_id', currentFilters.customerId);

            if (currentFilters.productIds.size > 0) {
                const { data: itemData, error: itemError } = await supabase.from('competitor_price_analysis_items').select('analysis_id').in('product_id', Array.from(currentFilters.productIds));
                if (itemError) throw itemError;
                const matchingAnalysisIds = (itemData || []).map((i: any) => i.analysis_id);
                analysisIdsQuery = analysisIdsQuery.in('id', matchingAnalysisIds);
            }

            const { data: idData, error: idError, count } = await analysisIdsQuery;
            if (idError) throw idError;
            setTotalCount(count || 0);

            if (!idData || idData.length === 0) {
                setReports([]);
                setLoading(false);
                return;
            }

            const startIndex = (page - 1) * ITEMS_PER_PAGE;
            const { data, error } = await supabase.from('competitor_price_analysis')
                .select('*, customer:customers(name), items:competitor_price_analysis_items(*, product:products(*))')
                .in('id', idData.map(i => i.id))
                .order('analysis_date', { ascending: false })
                .range(startIndex, startIndex + ITEMS_PER_PAGE - 1);
                
            if (error) throw error;
            setReports(data || []);

        } catch (error: any) {
            showNotification(`Failed to load reports: ${error.message}`, 'error');
        } finally {
            setLoading(false);
        }
    }, [pagePermissions, showNotification]);
    
    useEffect(() => { fetchDropdownData(); }, [fetchDropdownData]);
    useEffect(() => { fetchReports(currentPage, filters); }, [currentPage, filters, fetchReports]);

    const handleFilterChange = (field: keyof typeof filters, value: any) => {
        setFilters(prev => ({ ...prev, [field]: value }));
        setCurrentPage(1);
    };

    const handleProductFilterChange = (productId: string) => {
        const newSet = new Set(filters.productIds);
        if (newSet.has(productId)) newSet.delete(productId);
        else newSet.add(productId);
        handleFilterChange('productIds', newSet);
    };
    
    const handleResetFilters = () => {
        setFilters(initialFilters);
        setCurrentPage(1);
    };
    
    const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);
    if (!pagePermissions?.can_view) return <p>{t('error.accessDenied.message')}</p>;

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold">{t('competitorPriceAnalysisReport.title')}</h1>
            <div className="p-4 bg-surface dark:bg-dark-surface rounded-lg shadow-md border border-border dark:border-dark-border space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">{t('visitRequestReport.filters.dateRange')}</label>
                        <div className="flex items-center gap-2">
                            <input type="date" value={filters.startDate} onChange={e => handleFilterChange('startDate', e.target.value)} className="w-full p-2 bg-transparent border border-border dark:border-dark-border rounded-md text-sm" />
                            <input type="date" value={filters.endDate} onChange={e => handleFilterChange('endDate', e.target.value)} className="w-full p-2 bg-transparent border border-border dark:border-dark-border rounded-md text-sm" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">{t('reportProblem.customer')}</label>
                        <select value={filters.customerId} onChange={e => handleFilterChange('customerId', e.target.value)} className="w-full p-2 bg-surface dark:bg-dark-surface border border-border dark:border-dark-border rounded-md text-sm">
                            <option value="">{t('visitRequestReport.filters.all')}</option>
                            {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">{t('competitorPriceAnalysis.product')}</label>
                        <select onChange={e => handleProductFilterChange(e.target.value)} className="w-full p-2 bg-surface dark:bg-dark-surface border border-border dark:border-dark-border rounded-md text-sm">
                            <option value="">{t('competitorPriceAnalysisReport.filters.selectProduct')}</option>
                            {allProducts.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                        <div className="flex flex-wrap gap-1 mt-1">
                            {Array.from(filters.productIds).map((id: string) => {
                                const product = allProducts.find(p => p.id === id);
                                return product ? (
                                    <span key={id} className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full dark:bg-blue-900 dark:text-blue-300 flex items-center">
                                        {product.name}
                                        <button onClick={() => handleProductFilterChange(id)} className="ml-1.5 font-bold"><X className="h-3 w-3"/></button>
                                    </span>
                                ) : null;
                            })}
                        </div>
                    </div>
                </div>
                <div className="flex justify-end gap-2">
                    <button onClick={handleResetFilters} className="px-4 py-2 text-sm font-medium rounded-md border border-border dark:border-dark-border hover:bg-gray-100 dark:hover:bg-gray-800">{t('visitRequestReport.filters.reset')}</button>
                </div>
            </div>

            {loading ? <div className="text-center p-8"><Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" /></div> :
             reports.length === 0 ? <p className="text-center py-8 text-text-secondary">{t('visitRequestReport.noResults')}</p> :
             (
                <>
                    <div className="space-y-6">
                        {reports.map(r => <ReportCard key={r.id} report={r} onImageClick={setViewingImage}/>)}
                    </div>
                    {totalPages > 1 && (
                         <div className="flex items-center justify-between p-4">
                            <span className="text-sm text-text-secondary">{t('pagination.page').replace('{currentPage}', String(currentPage)).replace('{totalPages}', String(totalPages))} ({totalCount} {t('common.results')})</span>
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
                    <img src={viewingImage} alt="Competitor Item" className="max-w-full max-h-full rounded-lg" />
                    <button className="absolute top-4 right-4 p-2 bg-white/20 rounded-full text-white hover:bg-white/40"><X/></button>
                </div>
            )}
        </div>
    );
};

export default CompetitorPriceAnalysisReport;

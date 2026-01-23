import React, { useState, useEffect, useRef } from 'react';
import { useAppContext } from '../contexts/AppContext';
import { supabase } from '../services/supabase';
import { Customer } from '../types';
import { ImageUpload } from '../components/ImageUpload';
import { Search, Loader2, Save, Calendar } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

const ProductInsert: React.FC = () => {
    const { t, profile, permissions, showNotification } = useAppContext();
    const pagePermissions = permissions['Product Insert'];

    const [isSaving, setIsSaving] = useState(false);

    // Form State
    const [customerId, setCustomerId] = useState<string>('');
    const [customerSearch, setCustomerSearch] = useState('');
    const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
    const [isCustomerDropdownOpen, setIsCustomerDropdownOpen] = useState(false);
    const [productName, setProductName] = useState('');
    const [insertPrice, setInsertPrice] = useState<number | ''>('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [photoFiles, setPhotoFiles] = useState<File[]>([]);

    // Search Debounce
    const debounceTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
        if (customerSearch) {
            debounceTimeout.current = setTimeout(async () => {
                const lowercased = customerSearch.toLowerCase();
                const { data, error } = await supabase
                    .from('customers')
                    .select('*')
                    .or(`name.ilike.%${lowercased}%,customer_code.ilike.%${lowercased}%`)
                    .limit(10);
                
                if (error) {
                    console.error("Customer search error:", error);
                } else {
                    setFilteredCustomers(data || []);
                }
            }, 300);
        } else {
            setFilteredCustomers([]);
        }
        return () => { if (debounceTimeout.current) clearTimeout(debounceTimeout.current); };
    }, [customerSearch]);

    const handleSelectCustomer = (customer: Customer) => {
        setCustomerId(customer.id);
        setCustomerSearch(customer.name);
        setIsCustomerDropdownOpen(false);
    };

    const handleSave = async () => {
        if (!pagePermissions?.can_create) return;
        if (!customerId || !productName || insertPrice === '' || !startDate || !endDate) {
            showNotification(t('productInsert.validation.fieldsRequired'), 'error');
            return;
        }
        if (new Date(startDate) > new Date(endDate)) {
            showNotification(t('productDisplay.validation.dateError'), 'error');
            return;
        }

        setIsSaving(true);
        try {
            let photoUrls: string[] = [];
            if (photoFiles.length > 0) {
                const uploadPromises = photoFiles.map(async (file) => {
                    const filePath = `public/${profile?.id}/insert/${uuidv4()}`;
                    const { error: uploadError } = await supabase.storage.from('insert_photos').upload(filePath, file);
                    if (uploadError) throw new Error(`Image upload failed: ${uploadError.message}`);
                    return supabase.storage.from('insert_photos').getPublicUrl(filePath).data.publicUrl;
                });
                photoUrls = await Promise.all(uploadPromises);
            }

            const { error } = await supabase.from('product_inserts').insert({
                customer_id: customerId,
                product_name: productName,
                insert_price: Number(insertPrice),
                start_date: startDate,
                end_date: endDate,
                photo_urls: photoUrls,
                created_by: profile?.id
            });

            if (error) throw error;

            showNotification(t('productInsert.saveSuccess'), 'success');
            setCustomerId('');
            setCustomerSearch('');
            setProductName('');
            setInsertPrice('');
            setStartDate('');
            setEndDate('');
            setPhotoFiles([]);

        } catch (error: any) {
            showNotification(t('productInsert.saveError').replace('{error}', error.message), 'error');
        } finally {
            setIsSaving(false);
        }
    };

    if (!pagePermissions?.can_view) return <p>{t('error.accessDenied.message')}</p>;

    return (
        <div className="space-y-6 max-w-3xl mx-auto animate-fade-in-up">
             <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h1 className="text-3xl font-bold text-text-primary dark:text-dark-text-primary">{t('productInsert.title')}</h1>
                {pagePermissions.can_create && (
                    <button onClick={handleSave} disabled={isSaving} className="flex items-center justify-center px-6 py-2 bg-primary dark:bg-dark-primary text-white font-semibold rounded-md hover:bg-secondary dark:hover:bg-dark-secondary transition-colors disabled:opacity-50 shadow-md">
                        {isSaving ? <Loader2 className="h-5 w-5 mr-2 animate-spin" /> : <Save className="h-5 w-5 mr-2" />}
                        {isSaving ? t('common.saving') : t('form.save')}
                    </button>
                 )}
            </div>

            <div className="p-6 bg-surface dark:bg-dark-surface rounded-lg shadow-md border border-border dark:border-dark-border space-y-6">
                <div className="relative">
                    <label className="block text-sm font-medium mb-1">{t('productInsert.customer')}</label>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                            type="text"
                            value={customerSearch}
                            onChange={e => { setCustomerSearch(e.target.value); setIsCustomerDropdownOpen(true); if(!e.target.value) setCustomerId(''); }}
                            onFocus={() => setIsCustomerDropdownOpen(true)}
                            placeholder={t('productInsert.searchCustomer')}
                            className="w-full py-2 pl-10 pr-4 bg-transparent border border-border dark:border-dark-border rounded-md"
                        />
                    </div>
                    {isCustomerDropdownOpen && filteredCustomers.length > 0 && (
                        <ul className="absolute z-10 w-full bg-surface dark:bg-dark-surface border border-border dark:border-dark-border rounded-md mt-1 max-h-48 overflow-y-auto shadow-lg">
                            {filteredCustomers.map(cust => (
                                <li key={cust.id} onClick={() => handleSelectCustomer(cust)} className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer text-sm">
                                    {cust.name} ({cust.customer_code})
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium mb-1">{t('productInsert.startDate')}</label>
                        <div className="relative">
                             <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                             <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full py-2 pl-10 pr-3 bg-transparent border border-border dark:border-dark-border rounded-md text-sm" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">{t('productInsert.endDate')}</label>
                         <div className="relative">
                             <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                             <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full py-2 pl-10 pr-3 bg-transparent border border-border dark:border-dark-border rounded-md text-sm" />
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium mb-1">{t('productInsert.productName')}</label>
                        <input type="text" value={productName} onChange={e => setProductName(e.target.value)} className="w-full py-2 px-3 bg-transparent border border-border dark:border-dark-border rounded-md text-sm" />
                    </div>
                    
                     <div>
                        <label className="block text-sm font-medium mb-1">{t('productInsert.insertPrice')}</label>
                        <input type="number" step="0.01" value={insertPrice} onChange={e => setInsertPrice(e.target.value === '' ? '' : parseFloat(e.target.value))} className="w-full py-2 px-3 bg-transparent border border-border dark:border-dark-border rounded-md text-sm" />
                    </div>
                </div>

                <div>
                    <ImageUpload
                        files={photoFiles}
                        onChange={setPhotoFiles}
                        maxFiles={2}
                        label={t('productInsert.photos')}
                        buttonText={t('common.addPhoto')}
                    />
                </div>
            </div>
        </div>
    );
};

export default ProductInsert;

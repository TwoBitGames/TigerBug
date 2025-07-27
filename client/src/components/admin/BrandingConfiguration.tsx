import {useState, useEffect, useRef} from 'react';
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '../ui/card';
import {Button} from '../ui/button';
import {Input} from '../ui/input';
import {Label} from '../ui/label';
import {Textarea} from '../ui/textarea';
import {Separator} from '../ui/separator';
import {useDialog} from '../../contexts/DialogContext';
import {useBranding} from '../../contexts/BrandingContext';
import {adminApi} from '@/services/api.ts';
import {Palette, Upload, Link, Trash2, Image} from 'lucide-react';
import type {UpdateBrandingConfigData} from '@/types';

const SOCIAL_PLATFORMS = [
    {key: 'github', label: 'GitHub', placeholder: 'https://github.com/yourorganization'},
    {key: 'youtube', label: 'YouTube', placeholder: 'https://youtube.com/@yourchannel'},
    {key: 'steam', label: 'Steam', placeholder: 'https://store.steampowered.com/publisher/yourpublisher'},
    {key: 'twitter', label: 'Twitter/X', placeholder: 'https://twitter.com/yourhandle'},
    {key: 'linkedin', label: 'LinkedIn', placeholder: 'https://linkedin.com/company/yourcompany'},
    {key: 'facebook', label: 'Facebook', placeholder: 'https://facebook.com/yourpage'},
    {key: 'instagram', label: 'Instagram', placeholder: 'https://instagram.com/yourhandle'},
    {key: 'discord', label: 'Discord', placeholder: 'https://discord.gg/yourinvite'},
] as const;

export const BrandingConfiguration = () => {
    const {alert, toast} = useDialog();
    const {refreshBranding} = useBranding();
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState<{ logo: boolean; banner: boolean }>({logo: false, banner: false});
    const logoInputRef = useRef<HTMLInputElement>(null);
    const bannerInputRef = useRef<HTMLInputElement>(null);
    const [brandingForm, setBrandingForm] = useState<UpdateBrandingConfigData>({
        app_name: '',
        logo_url: null,
        banner_url: null,
        tagline: null,
        social_links: null,
        client_url: null,
    });

    useEffect(() => {
        loadBrandingConfig();
    }, []);

    const loadBrandingConfig = async () => {
        setLoading(true);
        try {
            const brandingData = await adminApi.getBrandingConfig();
            setBrandingForm({
                app_name: brandingData.app_name,
                logo_url: brandingData.logo_url,
                banner_url: brandingData.banner_url,
                tagline: brandingData.tagline,
                social_links: brandingData.social_links,
                client_url: brandingData.client_url,
            });
        } catch (error) {
            console.error('Failed to load branding config:', error);
            toast('Failed to load branding configuration.', {variant: 'destructive'});
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateBranding = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!brandingForm.app_name.trim()) {
            await alert('App name is required.');
            return;
        }

        try {
            await adminApi.updateBrandingConfig(brandingForm);
            toast('Branding configuration updated successfully!', {variant: 'success'});
            await refreshBranding();
        } catch (error) {
            console.error('Failed to update branding config:', error);
            toast('Failed to update branding configuration.', {variant: 'destructive'});
        }
    };

    const handleSocialLinkChange = (platform: string, value: string) => {
        setBrandingForm(prev => ({
            ...prev,
            social_links: {
                ...prev.social_links,
                [platform]: value || undefined,
            }
        }));
    };

    const handleRemoveSocialLink = (platform: string) => {
        setBrandingForm(prev => {
            const newSocialLinks = {...prev.social_links};
            delete newSocialLinks[platform as keyof typeof newSocialLinks];

            const hasLinks = Object.keys(newSocialLinks).length > 0;

            return {...prev, social_links: hasLinks ? newSocialLinks : null};
        });
    };

    const getSocialLinkValue = (platform: string): string => {
        return brandingForm.social_links?.[platform as keyof typeof brandingForm.social_links] || '';
    };

    const handleFileUpload = async (type: 'logo' | 'banner', file: File) => {
        if (!file.type.startsWith('image/')) {
            toast('Please select an image file', {variant: 'destructive'});
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            toast('Image file size must be less than 5MB', {variant: 'destructive'});
            return;
        }

        setUploading(prev => ({...prev, [type]: true}));

        try {
            const updatedConfig = await adminApi.uploadBrandingAsset(file, type);
            setBrandingForm(prev => ({
                ...prev,
                [`${type}_url`]: updatedConfig[`${type}_url`],
            }));
            toast(`${type.charAt(0).toUpperCase() + type.slice(1)} uploaded successfully!`, {variant: 'success'});
            await refreshBranding();
        } catch (error: any) {
            console.error(`Failed to upload ${type}:`, error);
            toast(error.message || `Failed to upload ${type}`, {variant: 'destructive'});
        } finally {
            setUploading(prev => ({...prev, [type]: false}));
        }
    };

    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            handleFileUpload('logo', file);
        }
        if (logoInputRef.current) {
            logoInputRef.current.value = '';
        }
    };

    const handleBannerUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            handleFileUpload('banner', file);
        }
        if (bannerInputRef.current) {
            bannerInputRef.current.value = '';
        }
    };

    const handleDeleteAsset = async (type: 'logo' | 'banner') => {
        try {
            const updatedConfig = await adminApi.deleteBrandingAsset(type);
            setBrandingForm(prev => ({
                ...prev,
                [`${type}_url`]: updatedConfig[`${type}_url`],
            }));
            toast(`${type.charAt(0).toUpperCase() + type.slice(1)} removed successfully!`, {variant: 'success'});
            await refreshBranding();
        } catch (error: any) {
            console.error(`Failed to delete ${type}:`, error);
            toast(error.message || `Failed to remove ${type}`, {variant: 'destructive'});
        }
    };

    if (loading) {
        return (
            <div className="p-6">
                <div className="flex items-center justify-center h-64">
                    <div>Loading branding configuration...</div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6">
            <div className="mb-6">
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <Palette className="h-6 w-6"/>
                    Branding Configuration
                </h1>
                <p className="text-muted-foreground">Customize your application's branding and social media presence</p>
            </div>

            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Basic Branding</CardTitle>
                        <CardDescription>
                            Configure the main branding elements of your application
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <form onSubmit={handleUpdateBranding} className="space-y-4">
                            <div>
                                <Label htmlFor="app_name">Application Name *</Label>
                                <Input
                                    id="app_name"
                                    value={brandingForm.app_name}
                                    onChange={(e) => setBrandingForm({...brandingForm, app_name: e.target.value})}
                                    placeholder="TigerBug"
                                    required
                                    maxLength={255}
                                />
                                <p className="text-xs text-muted-foreground mt-1">
                                    This name will appear in the navigation bar and page title
                                </p>
                            </div>

                            <div>
                                <Label className="flex items-center gap-2">
                                    <Upload className="h-4 w-4"/>
                                    Logo
                                </Label>
                                <div className="flex flex-col gap-3">
                                    {brandingForm.logo_url && (
                                        <div className="flex items-center gap-3 p-3 border rounded-lg">
                                            <img
                                                src={brandingForm.logo_url}
                                                alt="Current logo"
                                                className="h-12 w-12 rounded-full object-cover"
                                            />
                                            <div className="flex-1">
                                                <p className="text-sm font-medium">Current Logo</p>
                                                <p className="text-xs text-muted-foreground">Click upload to replace</p>
                                            </div>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleDeleteAsset('logo')}
                                                className="text-destructive hover:text-destructive"
                                            >
                                                <Trash2 className="h-4 w-4"/>
                                            </Button>
                                        </div>
                                    )}
                                    <div className="flex flex-col sm:flex-row gap-2">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => logoInputRef.current?.click()}
                                            disabled={uploading.logo}
                                            className="flex-1"
                                        >
                                            <Upload className="h-4 w-4 mr-2"/>
                                            {uploading.logo ? 'Uploading...' : brandingForm.logo_url ? 'Replace Logo' : 'Upload Logo'}
                                        </Button>
                                    </div>
                                    <input
                                        ref={logoInputRef}
                                        type="file"
                                        accept="image/*"
                                        onChange={handleLogoUpload}
                                        className="hidden"
                                    />
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Optional: Upload your logo image. Leave empty to use the default favicon.
                                </p>
                            </div>

                            <div>
                                <Label className="flex items-center gap-2">
                                    <Image className="h-4 w-4"/>
                                    Banner
                                </Label>
                                <div className="flex flex-col gap-3">
                                    {brandingForm.banner_url && (
                                        <div className="flex flex-col gap-3 p-3 border rounded-lg">
                                            <img
                                                src={brandingForm.banner_url}
                                                alt="Current banner"
                                                className="w-full h-24 rounded-lg object-cover"
                                            />
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-sm font-medium">Current Banner</p>
                                                    <p className="text-xs text-muted-foreground">Click upload to
                                                        replace</p>
                                                </div>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleDeleteAsset('banner')}
                                                    className="text-destructive hover:text-destructive"
                                                >
                                                    <Trash2 className="h-4 w-4"/>
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                    <div className="flex flex-col sm:flex-row gap-2">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => bannerInputRef.current?.click()}
                                            disabled={uploading.banner}
                                            className="flex-1"
                                        >
                                            <Upload className="h-4 w-4 mr-2"/>
                                            {uploading.banner ? 'Uploading...' : brandingForm.banner_url ? 'Replace Banner' : 'Upload Banner'}
                                        </Button>
                                    </div>
                                    <input
                                        ref={bannerInputRef}
                                        type="file"
                                        accept="image/*"
                                        onChange={handleBannerUpload}
                                        className="hidden"
                                    />
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Optional: Upload a banner image that will be displayed on the homepage.
                                </p>
                            </div>

                            <div>
                                <Label htmlFor="tagline">Tagline</Label>
                                <Textarea
                                    id="tagline"
                                    value={brandingForm.tagline || ''}
                                    onChange={(e) => setBrandingForm({
                                        ...brandingForm,
                                        tagline: e.target.value || null
                                    })}
                                    placeholder="Track bugs and manage feedback efficiently"
                                    rows={2}
                                    maxLength={500}
                                />
                                <p className="text-xs text-muted-foreground mt-1">
                                    Optional: A short description that appears in the footer
                                </p>
                            </div>

                            <div>
                                <Label htmlFor="client_url">Client URL</Label>
                                <Input
                                    id="client_url"
                                    value={brandingForm.client_url || ''}
                                    onChange={(e) => setBrandingForm({
                                        ...brandingForm,
                                        client_url: e.target.value || null
                                    })}
                                    placeholder="http://localhost:9840"
                                    type="url"
                                    maxLength={500}
                                />
                                <p className="text-xs text-muted-foreground mt-1">
                                    Optional: The base URL for your application (used in emails and links). If not set,
                                    the system will fall back to environment configuration.
                                </p>
                            </div>

                            <Button type="submit" className="w-full md:w-auto">
                                Update Branding
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Link className="h-5 w-5"/>
                            Social Media Links
                        </CardTitle>
                        <CardDescription>
                            Add links to your social media profiles. These will appear in the footer.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {SOCIAL_PLATFORMS.map((platform) => (
                            <div key={platform.key} className="flex items-end gap-2">
                                <div className="flex-1">
                                    <Label htmlFor={platform.key}>{platform.label}</Label>
                                    <Input
                                        id={platform.key}
                                        value={getSocialLinkValue(platform.key)}
                                        onChange={(e) => handleSocialLinkChange(platform.key, e.target.value)}
                                        placeholder={platform.placeholder}
                                        type="url"
                                        maxLength={500}
                                    />
                                </div>
                                {getSocialLinkValue(platform.key) && (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleRemoveSocialLink(platform.key)}
                                        className="mb-0 self-end"
                                    >
                                        <Trash2 className="h-4 w-4"/>
                                    </Button>
                                )}
                            </div>
                        ))}

                        <Separator/>

                        <div className="bg-muted/50 p-4 rounded-lg">
                            <h4 className="font-medium mb-2">Preview</h4>
                            <p className="text-sm text-muted-foreground">
                                Social links will appear as icons in the footer. Only platforms with URLs will be
                                displayed.
                                Currently configured: {' '}
                                {brandingForm.social_links
                                    ? Object.keys(brandingForm.social_links).length
                                    : 0} platform(s)
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

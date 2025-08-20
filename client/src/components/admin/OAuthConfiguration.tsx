import {useState, useEffect} from 'react';
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '../ui/card';
import {Button} from '../ui/button';
import {Input} from '../ui/input';
import {Label} from '../ui/label';
import {Switch} from '../ui/switch';
import {Badge} from '../ui/badge';
import {Separator} from '../ui/separator';
import {Key} from 'lucide-react';
import {SiGoogle, SiDiscord} from '@icons-pack/react-simple-icons';
import {useDialog} from '../../contexts/DialogContext';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '../ui/dialog';
import {authApi} from '@/services/api.ts';

interface OAuthProvider {
    provider: string;
    client_id: string;
    client_secret?: string;
    has_client_secret?: boolean;
    is_enabled: boolean;
    scope?: string;
    callback_url?: string;
}

const DEFAULT_PROVIDERS = [
    {
        provider: 'google',
        scope: 'profile email'
    },
    {
        provider: 'discord',
        scope: 'identify email'
    }
];

export const OAuthConfiguration = () => {
    const [configs, setConfigs] = useState<OAuthProvider[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [editingProvider, setEditingProvider] = useState<OAuthProvider | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const {toast} = useDialog();

    useEffect(() => {
        loadConfigs();
    }, []);

    const loadConfigs = async () => {
        try {
            setIsLoading(true);
            const response = await authApi.getOAuthConfigs();

            const mergedConfigs = DEFAULT_PROVIDERS.map(defaultProvider => {
                const existingConfig = response.configs.find((c: any) => c.provider === defaultProvider.provider);
                return existingConfig ? {...defaultProvider, ...existingConfig} : {
                    ...defaultProvider,
                    client_id: '',
                    client_secret: '',
                    is_enabled: false,
                    callback_url: `${window.location.origin}/api/auth/oauth/${defaultProvider.provider}/callback`
                };
            });

            setConfigs(mergedConfigs);
        } catch (error) {
            console.error('Failed to load OAuth configs:', error);
            toast('Failed to load OAuth configurations', {variant: 'destructive'});
        } finally {
            setIsLoading(false);
        }
    };

    const handleEditProvider = (provider: OAuthProvider) => {
        setEditingProvider({...provider});
    };

    const handleSaveProvider = async () => {
        if (!editingProvider) return;

        try {
            setIsSaving(true);
            await authApi.updateOAuthConfig(editingProvider.provider, {
                client_id: editingProvider.client_id,
                client_secret: editingProvider.client_secret === '***HIDDEN***' ? undefined : editingProvider.client_secret,
                is_enabled: editingProvider.is_enabled,
                scope: editingProvider.scope,
                callback_url: editingProvider.callback_url
            });

            toast('OAuth configuration updated successfully', {variant: 'success'});
            setEditingProvider(null);
            await loadConfigs();
        } catch (error) {
            console.error('Failed to update OAuth config:', error);
            toast('Failed to update OAuth configuration', {variant: 'destructive'});
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-24">
                <div className="text-center space-y-4">
                    <div className="relative">
                        <div
                            className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto"></div>
                        <Key
                            className="w-6 h-6 text-primary absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"/>
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold">Loading OAuth Configuration</h3>
                        <p className="text-muted-foreground">Please wait while we fetch your settings...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            <div className="space-y-2">
                <div className="flex items-center space-x-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                        <Key className="h-6 w-6 text-primary"/>
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">OAuth Configuration</h1>
                        <p className="text-muted-foreground text-lg">
                            Configure OAuth providers to allow users to sign in with their existing accounts.
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid gap-6">
                {configs.map((provider) => (
                    <Card key={provider.provider} className="overflow-hidden transition-shadow hover:shadow-md">
                        <CardHeader className="pb-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-4">
                                    <div className="flex items-center space-x-3">
                                        <div className="p-2 rounded-lg">
                                            {provider.provider === 'google' && (
                                                <SiGoogle size={24} color="#4285f4"/>
                                            )}
                                            {provider.provider === 'discord' && (
                                                <SiDiscord size={24} color="#5865f2"/>
                                            )}
                                        </div>
                                        <div>
                                            <CardTitle
                                                className="text-xl capitalize">{provider.provider}</CardTitle>
                                            <CardDescription className="mt-1">
                                                {provider.is_enabled
                                                    ? `${provider.provider} OAuth is active and ready to use.`
                                                    : `Set up ${provider.provider} OAuth to enable sign-in.`
                                                }
                                            </CardDescription>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-3">
                                    <Badge
                                        variant={provider.is_enabled ? 'default' : 'secondary'}
                                        className={provider.is_enabled ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100' : ''}
                                    >
                                        <div
                                            className={`w-2 h-2 rounded-full mr-1 ${provider.is_enabled ? 'bg-green-500' : 'bg-gray-400'}`}/>
                                        {provider.is_enabled ? 'Active' : 'Inactive'}
                                    </Badge>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleEditProvider(provider)}
                                        className="min-w-[100px]"
                                    >
                                        Configure
                                    </Button>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-3">
                                    <div>
                                        <Label className="text-sm font-medium text-muted-foreground">Client ID</Label>
                                        <p className="font-mono text-sm mt-1 p-2 bg-muted/50 rounded border break-all">
                                            {provider.client_id || (
                                                <span className="text-muted-foreground italic">Not configured</span>
                                            )}
                                        </p>
                                    </div>
                                    <div>
                                        <Label className="text-sm font-medium text-muted-foreground">Client
                                            Secret</Label>
                                        <p className="font-mono text-sm mt-1 p-2 bg-muted/50 rounded border break-all">
                                            {provider.has_client_secret ? (
                                                <span className="text-muted-foreground">••••••••••••••••</span>
                                            ) : (
                                                <span className="text-muted-foreground italic">Not configured</span>
                                            )}
                                        </p>
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <div>
                                        <Label className="text-sm font-medium text-muted-foreground">Callback
                                            URL</Label>
                                        <p className="font-mono text-xs mt-1 p-2 bg-muted/50 rounded border break-all">
                                            {provider.callback_url || `${window.location.origin}/api/auth/oauth/${provider.provider}/callback`}
                                        </p>
                                    </div>
                                    <div>
                                        <Label className="text-sm font-medium text-muted-foreground">OAuth
                                            Scopes</Label>
                                        <p className="text-sm mt-1 p-2 bg-muted/50 rounded border break-words">
                                            {provider.scope || (
                                                <span className="text-muted-foreground italic">Default scopes</span>
                                            )}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {editingProvider && (
                <Dialog open={!!editingProvider} onOpenChange={() => setEditingProvider(null)}>
                    <DialogContent className="sm:max-w-[700px] max-h-[85vh] overflow-y-auto">
                        <DialogHeader className="pb-6">
                            <div className="flex items-center space-x-3">
                                <div className="p-2 bg-primary/10 rounded-lg">
                                    {editingProvider.provider === 'google' && (
                                        <SiGoogle size={24} color="#4285f4"/>
                                    )}
                                    {editingProvider.provider === 'discord' && (
                                        <SiDiscord size={24} color="#5865f2"/>
                                    )}
                                </div>
                                <div>
                                    <DialogTitle
                                        className="text-xl">Configure {editingProvider.provider}</DialogTitle>
                                    <DialogDescription className="text-base mt-1">
                                        Set up OAuth integration
                                        for {editingProvider.provider}.
                                        You'll need to create an OAuth application in their developer console first.
                                    </DialogDescription>
                                </div>
                            </div>
                        </DialogHeader>

                        <div className="space-y-6">
                            <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border">
                                <div className="space-y-0.5">
                                    <Label className="text-base font-medium">Enable OAuth Provider</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Allow users to sign in with
                                        their {editingProvider.provider} account
                                    </p>
                                </div>
                                <Switch
                                    checked={editingProvider.is_enabled}
                                    onCheckedChange={(checked) =>
                                        setEditingProvider({...editingProvider, is_enabled: checked})
                                    }
                                />
                            </div>

                            <Separator/>

                            <div className="space-y-4">
                                <div>
                                    <h4 className="text-lg font-semibold mb-3">OAuth Credentials</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="client_id" className="text-sm font-medium">
                                                Client ID <span className="text-destructive">*</span>
                                            </Label>
                                            <Input
                                                id="client_id"
                                                value={editingProvider.client_id}
                                                onChange={(e) =>
                                                    setEditingProvider({...editingProvider, client_id: e.target.value})
                                                }
                                                placeholder="Enter client ID from OAuth app"
                                                className="font-mono"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="client_secret" className="text-sm font-medium">
                                                Client Secret <span className="text-destructive">*</span>
                                            </Label>
                                            <Input
                                                id="client_secret"
                                                type="password"
                                                value={editingProvider.client_secret}
                                                onChange={(e) =>
                                                    setEditingProvider({
                                                        ...editingProvider,
                                                        client_secret: e.target.value
                                                    })
                                                }
                                                placeholder={editingProvider.has_client_secret ? "••••••••••••••••" : "Enter client secret"}
                                                className="font-mono"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="callback_url" className="text-sm font-medium">Redirect/Callback
                                        URL</Label>
                                    <Input
                                        id="callback_url"
                                        value={editingProvider.callback_url}
                                        onChange={(e) =>
                                            setEditingProvider({...editingProvider, callback_url: e.target.value})
                                        }
                                        placeholder={`${window.location.origin}/api/auth/oauth/${editingProvider.provider}/callback`}
                                        className="font-mono text-sm"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="scope" className="text-sm font-medium">OAuth Scopes</Label>
                                    <Input
                                        id="scope"
                                        value={editingProvider.scope}
                                        onChange={(e) =>
                                            setEditingProvider({...editingProvider, scope: e.target.value})
                                        }
                                        placeholder="profile email"
                                        className="font-mono"
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Space-separated list of permissions to request from the OAuth provider.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <DialogFooter className="pt-6 gap-2">
                            <Button variant="outline" onClick={() => setEditingProvider(null)}>
                                Cancel
                            </Button>
                            <Button
                                onClick={handleSaveProvider}
                                disabled={isSaving || !editingProvider.client_id.trim()}
                                className="min-w-[120px]"
                            >
                                {isSaving ? (
                                    <>
                                        <div
                                            className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"/>
                                        Saving...
                                    </>
                                ) : (
                                    'Save Configuration'
                                )}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )}
        </div>
    );
};

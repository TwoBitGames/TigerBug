import {useState, useEffect} from 'react';
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '../ui/card';
import {Button} from '../ui/button';
import {Input} from '../ui/input';
import {Label} from '../ui/label';
import {Mail} from 'lucide-react';
import {useDialog} from '../../contexts/DialogContext';
import {adminApi} from '../../services/api';
import type {UpdateSMTPConfigData} from '../../types';

export const SMTPConfiguration = () => {
    const {alert, toast} = useDialog();
    const [loading, setLoading] = useState(true);
    const [testEmail, setTestEmail] = useState('');
    const [smtpForm, setSMTPForm] = useState<UpdateSMTPConfigData>({
        host: '',
        port: 587,
        username: '',
        password: '',
        use_tls: true,
        from_address: '',
    });

    useEffect(() => {
        loadSMTPConfig();
    }, []);

    const loadSMTPConfig = async () => {
        setLoading(true);
        try {
            const smtpData = await adminApi.getSMTPConfig();
            setSMTPForm({
                host: smtpData.host,
                port: smtpData.port,
                username: smtpData.username,
                password: '',
                use_tls: smtpData.use_tls,
                from_address: smtpData.from_address,
            });
        } catch (error) {
            console.error('Failed to load SMTP config:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateSMTP = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await adminApi.updateSMTPConfig(smtpForm);
            toast('SMTP configuration updated successfully!', { variant: 'success' });
        } catch (error) {
            console.error('Failed to update SMTP config:', error);
            toast('Failed to update SMTP configuration.', { variant: 'destructive' });
        }
    };

    const handleTestSMTP = async () => {
        if (!testEmail) {
            await alert('Please enter a test email address.');
            return;
        }

        try {
            await adminApi.testSMTPConfig(testEmail);
            toast('Test email sent successfully!', { variant: 'success' });
        } catch (error) {
            console.error('Failed to send test email:', error);
            toast('Failed to send test email. Check your configuration.', { variant: 'destructive' });
        }
    };

    if (loading) {
        return (
            <div className="p-6">
                <div className="flex items-center justify-center h-64">
                    <div>Loading SMTP configuration...</div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6">
            <div className="space-y-2 mb-6">
                <div className="flex items-center space-x-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                        <Mail className="h-6 w-6 text-primary"/>
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">SMTP Configuration</h1>
                        <p className="text-muted-foreground text-lg">
                            Configure email settings for system notifications and user communications.
                        </p>
                    </div>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Email Server Settings</CardTitle>
                    <CardDescription>
                        Configure your SMTP server for sending system emails
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <form onSubmit={handleUpdateSMTP} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="host">SMTP Host</Label>
                                <Input
                                    id="host"
                                    value={smtpForm.host}
                                    onChange={(e) => setSMTPForm({...smtpForm, host: e.target.value})}
                                    placeholder="smtp.example.com"
                                    required
                                />
                            </div>
                            <div>
                                <Label htmlFor="port">Port</Label>
                                <Input
                                    id="port"
                                    type="number"
                                    value={smtpForm.port}
                                    onChange={(e) => setSMTPForm({...smtpForm, port: parseInt(e.target.value) || 587})}
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <Label htmlFor="username">Username</Label>
                            <Input
                                id="username"
                                value={smtpForm.username}
                                onChange={(e) => setSMTPForm({...smtpForm, username: e.target.value})}
                                required
                            />
                        </div>

                        <div>
                            <Label htmlFor="password">Password</Label>
                            <Input
                                id="password"
                                type="password"
                                value={smtpForm.password}
                                onChange={(e) => setSMTPForm({...smtpForm, password: e.target.value})}
                                placeholder="Leave empty to keep current password"
                            />
                        </div>

                        <div>
                            <Label htmlFor="from_address">From Address</Label>
                            <Input
                                id="from_address"
                                type="email"
                                value={smtpForm.from_address}
                                onChange={(e) => setSMTPForm({...smtpForm, from_address: e.target.value})}
                                placeholder="noreply@example.com"
                                required
                            />
                        </div>

                        <div className="flex items-center space-x-2">
                            <input
                                type="checkbox"
                                id="use_tls"
                                checked={smtpForm.use_tls}
                                onChange={(e) => setSMTPForm({...smtpForm, use_tls: e.target.checked})}
                                className="rounded border border-input"
                            />
                            <Label htmlFor="use_tls">Use TLS/SSL encryption</Label>
                        </div>

                        <Button type="submit" className="w-full md:w-auto">
                            Update SMTP Configuration
                        </Button>
                    </form>

                    {/* Test Configuration */}
                    <div className="pt-6 border-t">
                        <h3 className="text-lg font-semibold mb-4">Test Configuration</h3>
                        <div className="space-y-4">
                            <div>
                                <Label htmlFor="test_email">Test Email Address</Label>
                                <Input
                                    id="test_email"
                                    placeholder="test@example.com"
                                    value={testEmail}
                                    onChange={(e) => setTestEmail(e.target.value)}
                                    type="email"
                                />
                            </div>
                            <Button
                                onClick={handleTestSMTP}
                                disabled={!testEmail}
                                variant="outline"
                                className="w-full md:w-auto"
                            >
                                Send Test Email
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

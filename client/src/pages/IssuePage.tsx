import { useParams } from 'react-router-dom';
import { IssueDetail } from '../components/IssueDetail';

export const IssuePage = () => {
  const { projectId, issueId } = useParams<{ projectId: string; issueId: string }>();

  if (!projectId || !issueId) {
    return (
      <div className="container py-8 px-4 text-center">
        <h1 className="text-2xl font-bold text-foreground mb-4">Invalid URL</h1>
        <p className="text-muted-foreground">Project ID and Issue ID are required.</p>
      </div>
    );
  }

  const handleBack = () => {
    window.history.back();
  };

  return (
    <div className="container py-8 px-4">
      <IssueDetail
        issueId={parseInt(issueId)}
        projectId={parseInt(projectId)}
        onBack={handleBack}
      />
    </div>
  );
};

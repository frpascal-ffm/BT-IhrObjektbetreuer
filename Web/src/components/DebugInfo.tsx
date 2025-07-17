import React from 'react';
import { useAuth } from '@/lib/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const DebugInfo = () => {
  const { currentUser } = useAuth();

  if (!currentUser) {
    return (
      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="text-sm">Debug Info</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500">Nicht angemeldet</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle className="text-sm">Debug Info</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Email:</span>
          <span className="text-sm">{currentUser.email}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">UID:</span>
          <span className="text-sm font-mono text-xs">{currentUser.uid}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Email Verified:</span>
          <Badge variant={currentUser.emailVerified ? "default" : "secondary"}>
            {currentUser.emailVerified ? "Ja" : "Nein"}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Auth Time:</span>
          <span className="text-sm">
            {new Date(currentUser.metadata.lastSignInTime || '').toLocaleString('de-DE')}
          </span>
        </div>
      </CardContent>
    </Card>
  );
};

export default DebugInfo; 
CREATE TABLE invitations (
    id UUID PRIMARY KEY,
    workspace_id UUID NOT NULL,
    email TEXT NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    accepted_membership_id UUID UNIQUE
);

CREATE TABLE memberships (
    id UUID PRIMARY KEY,
    invitation_id UUID NOT NULL UNIQUE REFERENCES invitations(id),
    workspace_id UUID NOT NULL,
    user_id UUID NOT NULL,
    revoked_at TIMESTAMP,
    UNIQUE (workspace_id, user_id)
);

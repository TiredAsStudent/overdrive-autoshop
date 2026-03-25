-- Allow expires_at to be NULL for permanent Customer Welcome Links
ALTER TABLE user_invitations ALTER COLUMN expires_at DROP NOT NULL;
CREATE TABLE addresses (id UUID NOT NULL PRIMARY KEY, "addressLine" TEXT NOT NULL);
CREATE UNIQUE INDEX "addresses_addressLine_key" ON addresses("addressLine");
INSERT INTO addresses (id, "addressLine")
SELECT gen_random_uuid(), value FROM (
 SELECT regexp_replace(trim(address), '\s+', ' ', 'g') AS value FROM profiles WHERE address IS NOT NULL
 UNION SELECT regexp_replace(trim(address), '\s+', ' ', 'g') FROM guardians WHERE address IS NOT NULL
 UNION SELECT regexp_replace(trim(address), '\s+', ' ', 'g') FROM local_guardians WHERE address IS NOT NULL
) old_addresses;
ALTER TABLE profiles ADD COLUMN "presentAddressId" UUID, ADD COLUMN "permanentAddressId" UUID;
UPDATE profiles p SET "presentAddressId" = a.id FROM addresses a WHERE a."addressLine" = regexp_replace(trim(p.address), '\s+', ' ', 'g');
ALTER TABLE profiles ADD CONSTRAINT "profiles_presentAddressId_fkey" FOREIGN KEY ("presentAddressId") REFERENCES addresses(id) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE profiles ADD CONSTRAINT "profiles_permanentAddressId_fkey" FOREIGN KEY ("permanentAddressId") REFERENCES addresses(id) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE profiles DROP COLUMN address;
ALTER TABLE guardians ADD COLUMN "addressId" UUID;
UPDATE guardians p SET "addressId" = a.id FROM addresses a WHERE a."addressLine" = regexp_replace(trim(p.address), '\s+', ' ', 'g');
ALTER TABLE guardians ADD CONSTRAINT "guardians_addressId_fkey" FOREIGN KEY ("addressId") REFERENCES addresses(id) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE guardians DROP COLUMN address;
ALTER TABLE local_guardians ADD COLUMN "addressId" UUID;
UPDATE local_guardians p SET "addressId" = a.id FROM addresses a WHERE a."addressLine" = regexp_replace(trim(p.address), '\s+', ' ', 'g');
ALTER TABLE local_guardians ADD CONSTRAINT "local_guardians_addressId_fkey" FOREIGN KEY ("addressId") REFERENCES addresses(id) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE local_guardians DROP COLUMN address;

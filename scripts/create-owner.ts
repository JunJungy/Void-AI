import { createOwnerAccount } from '../server/auth';

const OWNER_EMAIL = process.env.OWNER_EMAIL || 'owner@voidai.app';
const OWNER_PASSWORD = process.env.OWNER_PASSWORD || 'VoidOwner2024!';
const OWNER_NAME = process.env.OWNER_NAME || 'Void AI Owner';

async function main() {
  console.log('Creating owner account...');
  
  try {
    const owner = await createOwnerAccount(OWNER_EMAIL, OWNER_PASSWORD, OWNER_NAME);
    
    if (owner) {
      console.log('Owner account ready:');
      console.log('  Email:', OWNER_EMAIL);
      console.log('  Username:', owner.username);
      console.log('  Plan:', owner.planType);
      console.log('  Is Owner:', owner.isOwner);
    }
  } catch (error) {
    console.error('Failed to create owner account:', error);
    process.exit(1);
  }
}

main();

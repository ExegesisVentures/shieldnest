import { prisma } from '../lib/db';

const PMA_CONTENT = `
PRIVATE MEMBERSHIP AGREEMENT

This Private Membership Agreement ("Agreement") is entered into between the Member and ShieldNest, a private membership organization.

RECITALS

WHEREAS, ShieldNest operates as a private membership organization to provide enhanced privacy, security, and regulatory protection for its members;

WHEREAS, Member desires to participate in the private membership community and access the benefits provided therein;

WHEREAS, both parties wish to establish the terms and conditions of this private membership relationship;

NOW, THEREFORE, in consideration of the mutual covenants contained herein, the parties agree as follows:

1. MEMBERSHIP STATUS
Member voluntarily joins ShieldNest as a private member. This membership is not a public offering and is limited to approved individuals who meet our membership criteria.

2. PRIVATE NATURE OF ORGANIZATION
Member acknowledges that ShieldNest operates as a private membership organization, not as a public entity. All activities, services, and communications occur within the private membership context.

3. BENEFITS OF MEMBERSHIP
As a private member, Member receives:
- Enhanced privacy protections for personal and financial information
- Reduced regulatory compliance burdens
- Access to exclusive member-only services and features
- Protection from certain public sector regulations and scrutiny
- Cost savings passed through from reduced compliance expenses

4. MEMBER RESPONSIBILITIES
Member agrees to:
- Maintain the confidential nature of membership activities
- Comply with all membership guidelines and policies
- Respect the private nature of the organization
- Not disclose proprietary information to non-members

5. PRIVACY AND CONFIDENTIALITY
All member information, activities, and communications are maintained in strict confidence. Member data is protected under private membership privileges and is not subject to certain public disclosure requirements.

6. REGULATORY PROTECTION
By operating as a private membership organization, both Member and ShieldNest benefit from reduced regulatory oversight and compliance requirements compared to public entities.

7. VOLUNTARY PARTICIPATION
Member's participation is entirely voluntary. Member may terminate membership at any time by providing written notice.

8. LIMITATION OF LIABILITY
ShieldNest's liability to Member is limited to the extent permitted by law. Member participates in membership activities at their own risk.

9. GOVERNING LAW
This Agreement shall be governed by the laws of [Jurisdiction] and any disputes shall be resolved through private arbitration.

10. ENTIRE AGREEMENT
This Agreement constitutes the entire agreement between the parties and supersedes all prior negotiations, representations, or agreements relating to the subject matter herein.

By signing below, Member acknowledges they have read, understood, and agree to be bound by the terms of this Private Membership Agreement.

Member understands that this creates a private contractual relationship and that all activities occur within the private membership context.

Effective Date: [Date of Signature]
`;

async function setupPMA() {
  console.log('🚀 Setting up PMA document...');

  try {
    // Check if PMA already exists
    const existingPMA = await prisma.pMA.findFirst({
      where: { isActive: true }
    });

    if (existingPMA) {
      console.log('✅ PMA document already exists:', existingPMA.version);
      return;
    }

    // Create new PMA document
    const pma = await prisma.pMA.create({
      data: {
        version: '1.0',
        title: 'ShieldNest Private Membership Agreement',
        content: PMA_CONTENT,
        isActive: true
      }
    });

    console.log('✅ PMA document created successfully:');
    console.log(`   - Version: ${pma.version}`);
    console.log(`   - Title: ${pma.title}`);
    console.log(`   - ID: ${pma.id}`);

  } catch (error) {
    console.error('❌ Error setting up PMA:', error);
  }
}

// Run the setup if called directly
if (require.main === module) {
  setupPMA()
    .catch(console.error)
    .finally(() => process.exit(0));
}

export { setupPMA };

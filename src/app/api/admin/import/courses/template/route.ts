import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Sample CSV content matching our import file format
    const csvContent = `Title,Course Description,Course Certificates,Lessons,Internal SKU Number,CPA Credits,CPA Course Number,CFP Credits,CFP Course Number,EA / OTRP Credits,EA / OTRP Course Number,ERPA Credits,ERPA Course Number,CDFA Credits,CDFA Course Number,Main Subjects,States,Authors,CPA Subject,CFP Subject,EA/OTRP Subject,ERPA Subject,CDFA Subject,Online Price,Hardcopy Price,Video Price
"Introduction to Financial Planning","A comprehensive introduction to financial planning principles and strategies.","CPA Certificate|CFP Certificate","10","BHF001","10","FIN101","8","FP101","0","","0","","0","","Financial Planning|Introduction to Finance","NY|CA|TX","John Smith","Financial Planning","Financial Planning","","","","99.99","129.99","149.99"
"Advanced Tax Strategies","Learn advanced tax planning strategies for individuals and businesses.","CPA Certificate|EA Certificate","12","BHF002","15","TAX202","0","","12","EA12345","0","","0","","Tax Planning|Financial Planning","IL|PA|FL|CA","Jane Doe","Taxes","","Federal Tax Law","","","149.99","179.99","199.99"`;
    
    // Create headers for serving CSV file
    const headers = new Headers();
    headers.set('Content-Type', 'text/csv');
    headers.set('Content-Disposition', 'attachment; filename="course-import-template.csv"');
    
    return new NextResponse(csvContent, {
      status: 200,
      headers
    });
  } catch (error) {
    console.error('Error serving CSV template:', error);
    return NextResponse.json(
      { error: 'Failed to serve CSV template' },
      { status: 500 }
    );
  }
} 
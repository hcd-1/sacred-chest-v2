const { createClient } = require('@supabase/supabase-js');

exports.handler = async function (event, context) {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed' }),
    };
  }

  // Parse the request body
  let requestBody;
  try {
    requestBody = JSON.parse(event.body);
  } catch (error) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Invalid request body' }),
    };
  }

  const { verseIds } = requestBody;

  // Validate verseIds
  if (!Array.isArray(verseIds) || verseIds.length === 0) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'verseIds must be a non-empty array' }),
    };
  }

  // Initialize Supabase client with environment variables
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
  );

  try {
    // Query Supabase for verses with the provided IDs
    const { data: verses, error } = await supabase
      .from('verses')
      .select('*')
      .in('id', verseIds);

    if (error) {
      console.error('Supabase error:', error);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Error verifying favourites' }),
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify(verses || []),
    };
  } catch (error) {
    console.error('Unexpected error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};
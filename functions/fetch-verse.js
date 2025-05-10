const { createClient } = require('@supabase/supabase-js');

exports.handler = async function (event, context) {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Supabase credentials not configured' }),
    };
  }

  const supabaseClient = createClient(supabaseUrl, supabaseKey);

  try {
    const { action, year, month, day, special, selectedTrack } = JSON.parse(event.body);

    if (action === 'fetchVerseCounts') {
      const { data, error } = await supabaseClient
        .from('verses')
        .select('day_month, special')
        .not('day_month', 'is', null)
        .in('day_month', Array.from({ length: 31 }, (_, i) => (i + 1).toString()));

      if (error || !data) {
        return {
          statusCode: 404,
          body: JSON.stringify({ error: 'No verse data found' }),
        };
      }

      const verseCounts = {};
      data.forEach(({ day_month, special }) => {
        if (!verseCounts[day_month]) {
          verseCounts[day_month] = new Set();
        }
        if (special && !isNaN(parseInt(special))) {
          verseCounts[day_month].add(special);
        }
      });
      Object.keys(verseCounts).forEach((day) => {
        verseCounts[day] = verseCounts[day].size;
      });

      return {
        statusCode: 200,
        body: JSON.stringify(verseCounts),
      };
    }

    if (action === 'fetchMaxTracks') {
      const { data, error } = await supabaseClient
        .from('verses')
        .select('special')
        .not('day_month', 'is', null)
        .order('special', { ascending: false })
        .limit(1);

      if (error || !data || data.length === 0 || isNaN(parseInt(data[0].special))) {
        return {
          statusCode: 200,
          body: JSON.stringify({ maxTracks: 1 }),
        };
      }

      return {
        statusCode: 200,
        body: JSON.stringify({ maxTracks: parseInt(data[0].special) }),
      };
    }

    if (action === 'loadDailyVerse') {
      const { data, error } = await supabaseClient
        .from('verses')
        .select('*')
        .eq('special', 'daily')
        .single();

      if (error || !data) {
        return {
          statusCode: 404,
          body: JSON.stringify({ error: 'No daily verse available' }),
        };
      }

      return {
        statusCode: 200,
        body: JSON.stringify(data),
      };
    }

    if (action === 'loadOddEvenVerse') {
      const specialValue = parseInt(day) % 2 === 0 ? 'even' : 'odd';
      const { data, error } = await supabaseClient
        .from('verses')
        .select('*')
        .eq('special', specialValue)
        .single();

      if (error || !data) {
        return {
          statusCode: 404,
          body: JSON.stringify({ error: `No ${specialValue} verse available` }),
        };
      }

      return {
        statusCode: 200,
        body: JSON.stringify(data),
      };
    }

    if (action === 'loadDayOfWeekVerse') {
      const dayOfWeekMap = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
      const specialValue = dayOfWeekMap[new Date(year, month, day).getDay()];
      const { data, error } = await supabaseClient
        .from('verses')
        .select('*')
        .eq('special', specialValue)
        .single();

      if (error || !data) {
        return {
          statusCode: 404,
          body: JSON.stringify({ error: `No ${specialValue} verse available` }),
        };
      }

      return {
        statusCode: 200,
        body: JSON.stringify(data),
      };
    }

    if (action === 'loadDayOfMonthVerse') {
      const { data, error } = await supabaseClient
        .from('verses')
        .select('*')
        .eq('day_month', day);

      if (error || !data || data.length === 0) {
        return {
          statusCode: 404,
          body: JSON.stringify({ error: 'No verses available for this day' }),
        };
      }

      return {
        statusCode: 200,
        body: JSON.stringify(data),
      };
    }

    if (action === 'fetchVerseForFavorite') {
      if (special === 'daily') {
        const { data, error } = await supabaseClient
          .from('verses')
          .select('*')
          .eq('special', 'daily')
          .single();

        if (error || !data) {
          return {
            statusCode: 404,
            body: JSON.stringify({ error: 'No daily verse available' }),
          };
        }
        return {
          statusCode: 200,
          body: JSON.stringify(data),
        };
      } else if (special === 'odd-even') {
        const specialValue = parseInt(day) % 2 === 0 ? 'even' : 'odd';
        const { data, error } = await supabaseClient
          .from('verses')
          .select('*')
          .eq('special', specialValue)
          .single();

        if (error || !data) {
          return {
            statusCode: 404,
            body: JSON.stringify({ error: `No ${specialValue} verse available` }),
          };
        }
        return {
          statusCode: 200,
          body: JSON.stringify(data),
        };
      } else if (special === 'day-of-week') {
        const dayOfWeekMap = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
        const specialValue = dayOfWeekMap[new Date(year, month, day).getDay()];
        const { data, error } = await supabaseClient
          .from('verses')
          .select('*')
          .eq('special', specialValue)
          .single();

        if (error || !data) {
          return {
            statusCode: 404,
            body: JSON.stringify({ error: `No ${specialValue} verse available` }),
          };
        }
        return {
          statusCode: 200,
          body: JSON.stringify(data),
        };
      } else if (special === 'day-month') {
        const { data, error } = await supabaseClient
          .from('verses')
          .select('*')
          .eq('day_month', day)
          .eq('special', selectedTrack.toString())
          .single();

        if (error || !data) {
          // Fallback to first verse if specific track not found
          const { data: fallbackData, error: fallbackError } = await supabaseClient
            .from('verses')
            .select('*')
            .eq('day_month', day)
            .limit(1)
            .single();

          if (fallbackError || !fallbackData) {
            return {
              statusCode: 404,
              body: JSON.stringify({ error: 'No verse available for this day and track' }),
            };
          }
          return {
            statusCode: 200,
            body: JSON.stringify(fallbackData),
          };
        }
        return {
          statusCode: 200,
          body: JSON.stringify(data),
        };
      }
    }

    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Invalid action' }),
    };
  } catch (err) {
    console.error('Error in fetch-verse:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};
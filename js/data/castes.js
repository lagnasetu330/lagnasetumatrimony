/* ============================================================ GUJARATI CASTES DIRECTORY ============================================================ */
const ALL_CASTES = [
    // 1. Patidar / Patel
    { name: 'Kadva Patidar', guj: 'કડવા પાટીદાર', group: 'Patidar / Patel', keywords: 'kadva patel kadwa patidar kadvapatel કડવા પટેલ પાટીદાર' },
    { name: 'Leva Patidar', guj: 'લેવા પાટીદાર', group: 'Patidar / Patel', keywords: 'leva patel leuva patidar leuvad lewapatel લેવા પટેલ લેઉવા પાટીદાર' },
    { name: 'Anjana (Chaudhary) Patidar', guj: 'આંજણા ચૌધરી પાટીદાર', group: 'Patidar / Patel', keywords: 'anjana chaudhary chaudhari patel anjana patel આંજણા ચૌધરી પટેલ' },
    { name: 'Matiya Patidar', guj: 'મતિયા પાટીદાર', group: 'Patidar / Patel', keywords: 'matiya patel matia patidar મતિયા પટેલ' },

    // 2. Brahmin
    { name: 'Audichya Sahastra Brahmin', guj: 'ઔદીચ્ય સહસ્ર બ્રાહ્મણ', group: 'Brahmin', keywords: 'audichya sahastra sahasra brahmin ઔદીચ્ય સહસ્ર બ્રાહ્મણ' },
    { name: 'Audichya Zalawadi Brahmin', guj: 'ઔદીચ્ય ઝાલાવાડી બ્રાહ્મણ', group: 'Brahmin', keywords: 'audichya zalawadi jhalawadi brahmin ઔદીચ્ય ઝાલાવાડી બ્રાહ્મણ' },
    { name: 'Audichya Tolkiya Brahmin', guj: 'ઔદીચ્ય ટોળકીયા બ્રાહ્મણ', group: 'Brahmin', keywords: 'audichya tolkiya tolkia brahmin ઔદીચ્ય ટોળકીયા બ્રાહ્મણ' },
    { name: 'Nagar Brahmin', guj: 'નાગર બ્રાહ્મણ', group: 'Brahmin', keywords: 'nagar brahmin vadnagara visnagara prashnora નાગર બ્રાહ્મણ' },
    { name: 'Vadnagara Nagar Brahmin', guj: 'વડનગરા નાગર બ્રાહ્મણ', group: 'Brahmin', keywords: 'vadnagara vadnagari nagar brahmin વડનગરા નાગર બ્રાહ્મણ' },
    { name: 'Visnagara Nagar Brahmin', guj: 'વિસનગરા નાગર બ્રાહ્મણ', group: 'Brahmin', keywords: 'visnagara visnagari nagar brahmin વિસનગરા નાગર બ્રાહ્મણ' },
    { name: 'Prashnora Nagar Brahmin', guj: 'પ્રશ્નોરા નાગર બ્રાહ્મણ', group: 'Brahmin', keywords: 'prashnora nagar brahmin પ્રશ્નોરા નાગર બ્રાહ્મણ' },
    { name: 'Modh Brahmin', guj: 'મોઢ બ્રાહ્મણ', group: 'Brahmin', keywords: 'modh brahmin modhbrahmin મોઢ બ્રાહ્મણ' },
    { name: 'Shrimali Brahmin', guj: 'શ્રીમાળી બ્રાહ્મણ', group: 'Brahmin', keywords: 'shrimali srimali brahmin શ્રીમાળી બ્રાહ્મણ' },
    { name: 'Khedaval Brahmin', guj: 'ખેડાવાલ બ્રાહ્મણ', group: 'Brahmin', keywords: 'khedaval khedawal brahmin ખેડાવાલ બ્રાહ્મણ' },
    { name: 'Rajgor Brahmin', guj: 'રાજગોર બ્રાહ્મણ', group: 'Brahmin', keywords: 'rajgor rajgar brahmin રાજગોર બ્રાહ્મણ' },
    { name: 'Bardai Brahmin', guj: 'બારડાઈ બ્રાહ્મણ', group: 'Brahmin', keywords: 'bardai brahmin બારડાઈ બ્રાહ્મણ' },
    { name: 'Sompura Brahmin', guj: 'સોમપુરા બ્રાહ્મણ', group: 'Brahmin', keywords: 'sompura brahmin sompura salat સોમપુરા બ્રાહ્મણ' },
    { name: 'Trivedi Mewada Brahmin', guj: 'ત્રિવેદી મેવાડા બ્રાહ્મણ', group: 'Brahmin', keywords: 'trivedi mewada mevada brahmin ત્રિવેદી મેવાડા બ્રાહ્મણ' },
    { name: 'Bhatt Mewada Brahmin', guj: 'ભટ્ટ મેવાડા બ્રાહ્મણ', group: 'Brahmin', keywords: 'bhatt mewada mevada brahmin ભટ્ટ મેવાડા બ્રાહ્મણ' },
    { name: 'Tapodhan Brahmin', guj: 'તપોધન બ્રાહ્મણ', group: 'Brahmin', keywords: 'tapodhan tapodhan brahmin તપોધન બ્રાહ્મણ' },
    { name: 'Saraswat Brahmin', guj: 'સારસ્વત બ્રાહ્મણ', group: 'Brahmin', keywords: 'saraswat saraswata brahmin સારસ્વત બ્રાહ્મણ' },
    { name: 'Pushkarna Brahmin', guj: 'પુષ્કર્ણા બ્રાહ્મણ', group: 'Brahmin', keywords: 'pushkarna pokharna brahmin પુષ્કર્ણા બ્રાહ્મણ' },
    { name: 'Gurjar Brahmin', guj: 'ગુર્જર બ્રાહ્મણ', group: 'Brahmin', keywords: 'gurjar gujjar brahmin ગુર્જર બ્રાહ્મણ' },
    { name: 'Sorthiya Brahmin', guj: 'સોરઠીયા બ્રાહ્મણ', group: 'Brahmin', keywords: 'sorthiya sorathiya brahmin સોરઠીયા બ્રાહ્મણ' },
    { name: 'Kandolia Brahmin', guj: 'કંદોળીયા બ્રાહ્મણ', group: 'Brahmin', keywords: 'kandolia kandoliya brahmin કંદોળીયા બ્રાહ્મણ' },
    { name: 'Jambu Brahmin', guj: 'જંબુ બ્રાહ્મણ', group: 'Brahmin', keywords: 'jambu brahmin જંબુ બ્રાહ્મણ' },
    { name: 'Sachora Brahmin', guj: 'સાચોરા બ્રાહ્મણ', group: 'Brahmin', keywords: 'sachora sanchora brahmin સાચોરા બ્રાહ્મણ' },
    { name: 'Gomtiwal Brahmin', guj: 'ગોમતીવાલ બ્રાહ્મણ', group: 'Brahmin', keywords: 'gomtiwal gomtival brahmin ગોમતીવાલ બ્રાહ્મણ' },

    // 3. Kshatriya / Rajput
    { name: 'Karadia Rajput', guj: 'કારડીયા રાજપૂત', group: 'Kshatriya / Rajput', keywords: 'karadia karadiya rajput kshatriya કારડીયા રાજપૂત ક્ષત્રિય' },
    { name: 'Nadoda Rajput', guj: 'નાદોડા રાજપૂત', group: 'Kshatriya / Rajput', keywords: 'nadoda nadoda rajput નાદોડા રાજપૂત' },
    { name: 'Garasiya Rajput', guj: 'ગરાસિયા રાજપૂત', group: 'Kshatriya / Rajput', keywords: 'garasiya girasiya rajput kshatriya ગરાસિયા રાજપૂત' },
    { name: 'Gurjar Kshatriya', guj: 'ગુર્જર ક્ષત્રિય', group: 'Kshatriya / Rajput', keywords: 'gurjar gujjar kshatriya ગુર્જર ક્ષત્રિય' },
    { name: 'Kshatriya Rajput', guj: 'ક્ષત્રિય રાજપૂત', group: 'Kshatriya / Rajput', keywords: 'rajput rathod vaghela chauhan parmar gohil jadeja jhala solanki ક્ષત્રિય રાજપૂત' },
    { name: 'Kshatriya Thakor', guj: 'ક્ષત્રિય ઠાકોર', group: 'Kshatriya / Rajput', keywords: 'thakor thakore kshatriya thakor ઠાકોર ક્ષત્રિય' },
    { name: 'Kasbati Rajput', guj: 'કસબાતી રાજપૂત', group: 'Kshatriya / Rajput', keywords: 'kasbati kasbati rajput કસબાતી રાજપૂત' },
    { name: 'Maru Rajput', guj: 'મારુ રાજપૂત', group: 'Kshatriya / Rajput', keywords: 'maru maroo rajput મારુ રાજપૂત' },

    // 4. Vishwakarma (Suthar, Luhar, Panchal)
    { name: 'Luhar Suthar', guj: 'લુહાર સુથાર', group: 'Vishwakarma / Suthar', keywords: 'luhar suthar lohar suthar vishwakarma લુહાર સુથાર વિશ્વકર્મા' },
    { name: 'Gujjar Suthar', guj: 'ગુર્જર સુથાર', group: 'Vishwakarma / Suthar', keywords: 'gujjar suthar gurjar suthar vishwakarma ગુર્જર સુથાર' },
    { name: 'Mistry Suthar', guj: 'મિસ્ત્રી સુથાર', group: 'Vishwakarma / Suthar', keywords: 'mistry suthar mistri suthar મિસ્ત્રી સુથાર' },
    { name: 'Mewada Suthar', guj: 'મેવાડા સુથાર', group: 'Vishwakarma / Suthar', keywords: 'mewada mevada suthar મેવાડા સુથાર' },
    { name: 'Vansh Suthar', guj: 'વંશ સુથાર', group: 'Vishwakarma / Suthar', keywords: 'vansh suthar vanshsuthar વંશ સુથાર' },
    { name: 'Panchal', guj: 'પંચાલ', group: 'Vishwakarma / Suthar', keywords: 'panchal panchal suthar luhar પંચાલ' },
    { name: 'Luhar', guj: 'લુહાર', group: 'Vishwakarma / Suthar', keywords: 'luhar lohar black smith લુહાર' },
    { name: 'Gujjar Luhar', guj: 'ગુર્જર લુહાર', group: 'Vishwakarma / Suthar', keywords: 'gujjar luhar gurjar luhar ગુર્જર લુહાર' },
    { name: 'Bhavnagari Luhar', guj: 'ભાવનગરી લુહાર', group: 'Vishwakarma / Suthar', keywords: 'bhavnagari luhar ભાવનગરી લુહાર' },
    { name: 'Sihori Luhar', guj: 'શિહોરી લુહાર', group: 'Vishwakarma / Suthar', keywords: 'sihori luhar શિહોરી લુહાર' },
    { name: 'Kadiwal Luhar', guj: 'કડીવાલ લુહાર', group: 'Vishwakarma / Suthar', keywords: 'kadiwal luhar કડીવાલ લુહાર' },
    { name: 'Pithva Suthar', guj: 'પીઠવા સુથાર', group: 'Vishwakarma / Suthar', keywords: 'pithva pithwa suthar પીઠવા સુથાર' },

    // 5. Prajapati / Kumbhar
    { name: 'Gujjar Prajapati', guj: 'ગુર્જર પ્રજાપતિ', group: 'Prajapati / Kumbhar', keywords: 'gujjar prajapati gurjar prajapati ગુર્જર પ્રજાપતિ' },
    { name: 'Varia Prajapati', guj: 'વરિયા પ્રજાપતિ', group: 'Prajapati / Kumbhar', keywords: 'varia wariya prajapati વરિયા પ્રજાપતિ' },
    { name: 'Sorathiya Prajapati', guj: 'સોરઠીયા પ્રજાપતિ', group: 'Prajapati / Kumbhar', keywords: 'sorathiya sorthiya prajapati સોરઠીયા પ્રજાપતિ' },
    { name: 'Lad Prajapati', guj: 'લાડ પ્રજાપતિ', group: 'Prajapati / Kumbhar', keywords: 'lad prajapati laad prajapati લાડ પ્રજાપતિ' },
    { name: 'Kumbhar', guj: 'કુંભાર', group: 'Prajapati / Kumbhar', keywords: 'kumbhar prajapati કુંભાર' },
    { name: 'Ajwaliya Prajapati', guj: 'અજવાળિયા પ્રજાપતિ', group: 'Prajapati / Kumbhar', keywords: 'ajwaliya ajvaliya prajapati અજવાળિયા પ્રજાપતિ' },

    // 6. Vanik / Vaishnav / Baniya
    { name: 'Modh Vanik', guj: 'મોઢ વણિક', group: 'Vanik / Vaishnav', keywords: 'modh vanik vaniya baniya મોઢ વણિક વાણિયા' },
    { name: 'Dasha Shrimali Vanik', guj: 'દશા શ્રીમાળી વણિક', group: 'Vanik / Vaishnav', keywords: 'dasha shrimali vanik baniya દશા શ્રીમાળી વણિક' },
    { name: 'Visa Shrimali Vanik', guj: 'વિસા શ્રીમાળી વણિક', group: 'Vanik / Vaishnav', keywords: 'visa shrimali vanik baniya વિસા શ્રીમાળી વણિક' },
    { name: 'Porwad Vanik', guj: 'પોરવાડ વણિક', group: 'Vanik / Vaishnav', keywords: 'porwad porwal vanik પોરવાડ વણિક' },
    { name: 'Khadayata Vanik', guj: 'ખડાયતા વણિક', group: 'Vanik / Vaishnav', keywords: 'khadayata khadayta vanik ખડાયતા વણિક' },
    { name: 'Kapol Vanik', guj: 'કપોળ વણિક', group: 'Vanik / Vaishnav', keywords: 'kapol vanik kapol baniya કપોળ વણિક' },
    { name: 'Harsola Vanik', guj: 'હરસોલા વણિક', group: 'Vanik / Vaishnav', keywords: 'harsola vanik હરસોલા વણિક' },
    { name: 'Lad Vanik', guj: 'લાડ વણિક', group: 'Vanik / Vaishnav', keywords: 'lad vanik laad vanik લાડ વણિક' },
    { name: 'Dasha Porwad', guj: 'દશા પોરવાડ', group: 'Vanik / Vaishnav', keywords: 'dasha porwad porwal દશા પોરવાડ' },
    { name: 'Visa Porwad', guj: 'વિસા પોરવાડ', group: 'Vanik / Vaishnav', keywords: 'visa porwad porwal વિસા પોરવાડ' },
    { name: 'Jharola Vanik', guj: 'ઝરોળા વણિક', group: 'Vanik / Vaishnav', keywords: 'jharola zarola vanik ઝરોળા વણિક' },
    { name: 'Mewada Vanik', guj: 'મેવાડા વણિક', group: 'Vanik / Vaishnav', keywords: 'mewada mevada vanik મેવાડા વણિક' },
    { name: 'Nema Vanik', guj: 'નેમા વણિક', group: 'Vanik / Vaishnav', keywords: 'nema vanik નેમા વણિક' },
    { name: 'Deshaval Vanik', guj: 'દેશાવાળ વણિક', group: 'Vanik / Vaishnav', keywords: 'deshaval deshavad vanik દેશાવાળ વણિક' },
    { name: 'Vaishnav Vanik', guj: 'વૈષ્ણવ વણિક', group: 'Vanik / Vaishnav', keywords: 'vaishnav vanik vaishnav baniya વૈષ્ણવ વણિક' },

    // 7. Lohana
    { name: 'Halai Lohana', guj: 'હાલાઈ લોહાણા', group: 'Lohana', keywords: 'halai lohana thakkar luwana હાલાઈ લોહાણા ઠક્કર' },
    { name: 'Ghoghari Lohana', guj: 'ઘોઘારી લોહાણા', group: 'Lohana', keywords: 'ghoghari goghari lohana thakkar ઘોઘારી લોહાણા' },
    { name: 'Kutchi Lohana', guj: 'કચ્છી લોહાણા', group: 'Lohana', keywords: 'kutchi kutchhi lohana thakkar કચ્છી લોહાણા' },
    { name: 'Vaishnav Lohana', guj: 'વૈષ્ણવ લોહાણા', group: 'Lohana', keywords: 'vaishnav lohana thakkar વૈષ્ણવ લોહાણા' },

    // 8. Ahir / Rabari / Bharwad (Maldhari)
    { name: 'Machhoya Ahir', guj: 'મચ્છોયા આહીર', group: 'Ahir / Maldhari', keywords: 'machhoya ahir aahir મચ્છોયા આહીર' },
    { name: 'Sorathiya Ahir', guj: 'સોરઠીયા આહીર', group: 'Ahir / Maldhari', keywords: 'sorathiya sorthiya ahir aahir સોરઠીયા આહીર' },
    { name: 'Boricha Ahir', guj: 'બોરીચા આહીર', group: 'Ahir / Maldhari', keywords: 'boricha ahir aahir બોરીચા આહીર' },
    { name: 'Pancholi Ahir', guj: 'પાંચોળી આહીર', group: 'Ahir / Maldhari', keywords: 'pancholi ahir aahir પાંચોળી આહીર' },
    { name: 'Paratharia Ahir', guj: 'પરાથરિયા આહીર', group: 'Ahir / Maldhari', keywords: 'paratharia parathariya ahir aahir પરાથરિયા આહીર' },
    { name: 'Rabari', guj: 'રબારી', group: 'Ahir / Maldhari', keywords: 'rabari rayka desai રબારી રાયકા દેસાઈ' },
    { name: 'Vadhiyar Rabari', guj: 'વઢિયાર રબારી', group: 'Ahir / Maldhari', keywords: 'vadhiyar vadhiyari rabari વઢિયાર રબારી' },
    { name: 'Patanwadia Rabari', guj: 'પાટણવાડિયા રબારી', group: 'Ahir / Maldhari', keywords: 'patanwadia patanwadiya rabari પાટણવાડિયા રબારી' },
    { name: 'Kutchi Rabari', guj: 'કચ્છી રબારી', group: 'Ahir / Maldhari', keywords: 'kutchi kutchhi rabari કચ્છી રબારી' },
    { name: 'Bharwad', guj: 'ભરવાડ', group: 'Ahir / Maldhari', keywords: 'bharwad bharvad mota nana ભરવાડ' },
    { name: 'Mota Bharwad', guj: 'મોટા ભરવાડ', group: 'Ahir / Maldhari', keywords: 'mota bharwad મોટા ભરવાડ' },
    { name: 'Nana Bharwad', guj: 'નાના ભરવાડ', group: 'Ahir / Maldhari', keywords: 'nana bharwad નાના ભરવાડ' },

    // 9. Koli
    { name: 'Talpada Koli', guj: 'તળપદા કોળી', group: 'Koli', keywords: 'talpada koli thakor તળપદા કોળી' },
    { name: 'Chunvalia Koli', guj: 'ચુંવાળિયા કોળી', group: 'Koli', keywords: 'chunvalia chunvaliya koli thakor ચુંવાળિયા કોળી' },
    { name: 'Ghedia Koli', guj: 'ઘેડિયા કોળી', group: 'Koli', keywords: 'ghedia ghediya koli ઘેડિયા કોળી' },
    { name: 'Thakor Koli', guj: 'ઠાકોર કોળી', group: 'Koli', keywords: 'thakor koli thakore ઠાકોર કોળી' },
    { name: 'Baria Koli', guj: 'બારિયા કોળી', group: 'Koli', keywords: 'baria bariya koli બારિયા કોળી' },
    { name: 'Dharala Koli', guj: 'ધરાળા કોળી', group: 'Koli', keywords: 'dharala koli ધરાળા કોળી' },
    { name: 'Koli Patel', guj: 'કોળી પટેલ', group: 'Koli', keywords: 'koli patel કોળી પટેલ' },

    // 10. Artisan & Traditional Crafts (Darji, Soni, Kansara, Bhavsar, Khatri, etc.)
    { name: 'Soni', guj: 'સોની', group: 'Artisan & Trade', keywords: 'soni swarnakar goldsmith સોની' },
    { name: 'Shrimali Soni', guj: 'શ્રીમાળી સોની', group: 'Artisan & Trade', keywords: 'shrimali srimali soni શ્રીમાળી સોની' },
    { name: 'Gujjar Soni', guj: 'ગુર્જર સોની', group: 'Artisan & Trade', keywords: 'gujjar soni gurjar soni ગુર્જર સોની' },
    { name: 'Maru Soni', guj: 'મારુ સોની', group: 'Artisan & Trade', keywords: 'maru soni મારુ સોની' },
    { name: 'Kansara', guj: 'કંસારા', group: 'Artisan & Trade', keywords: 'kansara coppersmith કંસારા' },
    { name: 'Darji', guj: 'દરજી', group: 'Artisan & Trade', keywords: 'darji tailor દરજી' },
    { name: 'Ramdev Darji', guj: 'રામદેવ દરજી', group: 'Artisan & Trade', keywords: 'ramdev darji રામદેવ દરજી' },
    { name: 'Charaniya Darji', guj: 'ચારણીયા દરજી', group: 'Artisan & Trade', keywords: 'charaniya darji ચારણીયા દરજી' },
    { name: 'Bhavsar', guj: 'ભાવસાર', group: 'Artisan & Trade', keywords: 'bhavsar bhavasar ભાવસાર' },
    { name: 'Khatri', guj: 'ખત્રી', group: 'Artisan & Trade', keywords: 'khatri kshatriya ખત્રી' },
    { name: 'Brahma Kshatriya', guj: 'બ્રહ્મક્ષત્રિય', group: 'Artisan & Trade', keywords: 'brahma kshatriya brahmakshatriya બ્રહ્મક્ષત્રિય' },
    { name: 'Ghanchi', guj: 'ઘાંચી', group: 'Artisan & Trade', keywords: 'ghanchi modh ghanchi તેલી ઘાંચી' },
    { name: 'Modh Ghanchi', guj: 'મોઢ ઘાંચી', group: 'Artisan & Trade', keywords: 'modh ghanchi મોઢ ઘાંચી' },
    { name: 'Salvi', guj: 'સાળવી', group: 'Artisan & Trade', keywords: 'salvi patola weaver સાળવી' },
    { name: 'Chhipa', guj: 'છીપા', group: 'Artisan & Trade', keywords: 'chhipa printer છીપા' },
    { name: 'Rangrez', guj: 'રંગરેઝ', group: 'Artisan & Trade', keywords: 'rangrez ranger રંગરેઝ' },
    { name: 'Tamboli', guj: 'તંબોળી', group: 'Artisan & Trade', keywords: 'tamboli panwala તંબોળી' },

    // 11. Valand / Limbachiya
    { name: 'Limbachiya', guj: 'લિંબાચીયા', group: 'Valand / Limbachiya', keywords: 'limbachiya limbachia nai valand લિંબાચીયા' },
    { name: 'Valand / Nai', guj: 'વાણંદ / નાઈ', group: 'Valand / Limbachiya', keywords: 'valand vanand nai barber વાણંદ નાઈ' },
    { name: 'Gujjar Valand', guj: 'ગુર્જર વાણંદ', group: 'Valand / Limbachiya', keywords: 'gujjar valand gurjar vanand ગુર્જર વાણંદ' },

    // 12. Charan / Gadhvi
    { name: 'Maru Charan', guj: 'મારુ ચારણ', group: 'Charan / Gadhvi', keywords: 'maru charan gadhvi મારુ ચારણ ગઢવી' },
    { name: 'Kachela Charan', guj: 'કછેલા ચારણ', group: 'Charan / Gadhvi', keywords: 'kachela charan gadhvi કછેલા ચારણ ગઢવી' },
    { name: 'Tumbel Charan', guj: 'તુંબેલ ચારણ', group: 'Charan / Gadhvi', keywords: 'tumbel charan gadhvi તુંબેલ ચારણ ગઢવી' },

    // 13. Scheduled Communities
    { name: 'Vankar', guj: 'વણકર', group: 'Scheduled Communities', keywords: 'vankar weaver વણકર' },
    { name: 'Rohit', guj: 'રોહિત', group: 'Scheduled Communities', keywords: 'rohit chakor રોહિત' },
    { name: 'Meghwal', guj: 'મેઘવાલ', group: 'Scheduled Communities', keywords: 'meghwal maheshwari મેઘવાલ' },
    { name: 'Maheshwari Meghwal', guj: 'માહેશ્વરી મેઘવાલ', group: 'Scheduled Communities', keywords: 'maheshwari meghwal માહેશ્વરી મેઘવાલ' },
    { name: 'Garoda', guj: 'ગરોડા', group: 'Scheduled Communities', keywords: 'garoda guruda ગરોડા' },
    { name: 'Senva', guj: 'સેણવા', group: 'Scheduled Communities', keywords: 'senva senwa સેણવા' },
    { name: 'Valmiki', guj: 'વાલ્મીકિ', group: 'Scheduled Communities', keywords: 'valmiki bhangi વાલ્મીકિ' },

    // 14. Other Traditional Hindu Communities
    { name: 'Goswami / Bava / Sadhu', guj: 'ગોસ્વામી / બાવા / સાધુ', group: 'Traditional Communities', keywords: 'goswami bava sadhu mahant puri giri bharathi ગોસ્વામી બાવા સાધુ' },
    { name: 'Atit Goswami', guj: 'અતીત ગોસ્વામી', group: 'Traditional Communities', keywords: 'atit goswami bava અતીત ગોસ્વામી' },
    { name: 'Margi Sadhu', guj: 'માર્ગી સાધુ', group: 'Traditional Communities', keywords: 'margi sadhu માર્ગી સાધુ' },
    { name: 'Raval / Ravaldev', guj: 'રાવળ / રાવળદેવ', group: 'Traditional Communities', keywords: 'raval ravaldev rawaldev રાવળ રાવળદેવ' },
    { name: 'Bhoi', guj: 'ભોઈ', group: 'Traditional Communities', keywords: 'bhoi kahar ભોઈ' },
    { name: 'Kharwa', guj: 'ખારવા', group: 'Traditional Communities', keywords: 'kharwa sagarkhedu sailor ખારવા' },
    { name: 'Machhi', guj: 'માછી', group: 'Traditional Communities', keywords: 'machhi koli machhi fisherman માછી' },
    { name: 'Devipujak / Vaghri', guj: 'દેવીપૂજક / વાઘરી', group: 'Traditional Communities', keywords: 'devipujak vaghri વાઘરી દેવીપૂજક' },
    { name: 'Chunvalia Devipujak', guj: 'ચુંવાળિયા દેવીપૂજક', group: 'Traditional Communities', keywords: 'chunvalia devipujak ચુંવાળિયા દેવીપૂજક' },
    { name: 'Bajania', guj: 'બાજણિયા', group: 'Traditional Communities', keywords: 'bajania bajaniya બાજણિયા' },
    { name: 'Nat', guj: 'નટ', group: 'Traditional Communities', keywords: 'nat acrobatics નટ' },
    { name: 'Vanjara / Banjara', guj: 'વણજારા / બંજારા', group: 'Traditional Communities', keywords: 'vanjara banjara વણજારા બંજારા' },
    { name: 'Ode / Oad', guj: 'ઓડ', group: 'Traditional Communities', keywords: 'ode oad utpanna ઓડ' },
    { name: 'Sathwara', guj: 'સાથવારા', group: 'Traditional Communities', keywords: 'sathwara sagar શાકભાજી સાથવારા' },
    { name: 'Kadia', guj: 'કડિયા', group: 'Traditional Communities', keywords: 'kadia mason કડિયા' },
    { name: 'Gujjar Kadia', guj: 'ગુર્જર કડિયા', group: 'Traditional Communities', keywords: 'gujjar kadia gurjar kadia ગુર્જર કડિયા' },
    { name: 'Salat', guj: 'સલાટ', group: 'Traditional Communities', keywords: 'salat stone artist સલાટ' },
    { name: 'Dabgar', guj: 'ડબગર', group: 'Traditional Communities', keywords: 'dabgar ડબગર' },
    { name: 'Barot / Brahmbhatt', guj: 'બારોટ / બ્રહ્મભટ્ટ', group: 'Traditional Communities', keywords: 'barot brahmbhatt bhat બારોટ બ્રહ્મભટ્ટ' },
    { name: 'Bhat / Vahivancha Barot', guj: 'ભાટ / વહીવંચા બારોટ', group: 'Traditional Communities', keywords: 'bhat vahivancha barot ભાટ વહીવંચા બારોટ' },
    { name: 'Charan Barot', guj: 'ચારણ બારોટ', group: 'Traditional Communities', keywords: 'charan barot ચારણ બારોટ' }
];

function getActiveCastes() {
    try {
        const stored = localStorage.getItem(LS_CASTES_KEY);
        if (stored) {
            const list = JSON.parse(stored);
            if (Array.isArray(list) && list.length > 0) return list;
        }
    } catch(e) {
        console.error("Error reading community castes", e);
    }
    return ALL_CASTES;
}

if (!localStorage.getItem(LS_CASTES_KEY)) {
    try {
        localStorage.setItem(LS_CASTES_KEY, JSON.stringify(ALL_CASTES));
    } catch(e) {}
}

window.ALL_CASTES = ALL_CASTES;
window.getActiveCastes = getActiveCastes;

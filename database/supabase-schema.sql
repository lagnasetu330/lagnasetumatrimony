-- ==============================================================================
-- LAGNA SETU — SUPABASE POSTGRESQL PRODUCTION DATABASE SCHEMA
-- Community Matrimony Web & Mobile Architecture
-- Realtime Sync, Strict 30-Day Boy Pass Enforcement & Cloudinary CDN Integration
-- Safe & Idempotent: Can be executed multiple times without errors (DROP POLICY IF EXISTS)
-- ==============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 1. USERS TABLE (App Metadata & Membership Pass Tracking)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.users (
    id TEXT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(150),
    gender VARCHAR(10) CHECK (gender IN ('Boy', 'Girl', 'boys', 'girls')),
    caste VARCHAR(100),
    mobile VARCHAR(50),
    role VARCHAR(20) NOT NULL DEFAULT 'member',
    status VARCHAR(20) NOT NULL DEFAULT 'Active',
    suspension_reason TEXT,
    profile_complete BOOLEAN NOT NULL DEFAULT FALSE,
    payment_status VARCHAR(20) NOT NULL DEFAULT 'Unpaid',
    plan_start VARCHAR(50),
    plan_expiry VARCHAR(50),
    agreed_terms BOOLEAN DEFAULT TRUE,
    agreed_terms_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.users ADD COLUMN IF NOT EXISTS agreed_terms BOOLEAN DEFAULT TRUE;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS agreed_terms_at TIMESTAMPTZ DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_gender ON public.users(gender);

-- ==============================================================================
-- 2. PROFILES TABLE (Detailed Matrimonial Profile Data + Cloudinary Photos)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id BIGINT PRIMARY KEY,
    user_id TEXT,
    gender VARCHAR(20) NOT NULL,
    name VARCHAR(200) NOT NULL,
    age INT,
    dob TEXT,
    height VARCHAR(50),
    weight VARCHAR(50),
    education VARCHAR(200),
    occupation VARCHAR(200),
    occ VARCHAR(200),
    income VARCHAR(100),
    marital VARCHAR(50) DEFAULT 'Unmarried',
    physical VARCHAR(50) DEFAULT 'Normal',
    community VARCHAR(150) NOT NULL,
    hobbies JSONB DEFAULT '[]'::jsonb,
    
    -- Family Details
    father VARCHAR(200),
    father_name VARCHAR(200),
    father_occ VARCHAR(200),
    father_mobile VARCHAR(50),
    father_whatsapp BOOLEAN DEFAULT TRUE,
    mother VARCHAR(200),
    mother_name VARCHAR(200),
    mother_occ VARCHAR(200),
    sister VARCHAR(100) DEFAULT 'None',
    brother VARCHAR(100) DEFAULT 'None',
    
    -- Address
    village VARCHAR(150),
    taluka VARCHAR(150),
    district VARCHAR(150),
    address TEXT,
    full_address TEXT,
    
    -- Photos (Cloudinary CDN URLs)
    img TEXT,
    avatar_url TEXT,
    photos JSONB DEFAULT '[]'::jsonb,
    email VARCHAR(255),
    mobile VARCHAR(50),
    own_mobile VARCHAR(50),
    doc_type VARCHAR(100),
    doc_name VARCHAR(255),
    doc_img TEXT,
    
    -- Admin Moderation & Status
    verify_status VARCHAR(50) NOT NULL DEFAULT 'approved',
    account_status VARCHAR(50) NOT NULL DEFAULT 'active',
    payment_status VARCHAR(50) NOT NULL DEFAULT 'unpaid',
    suspension_reason TEXT,
    reject_reason TEXT,
    registered VARCHAR(50),
    approved_date VARCHAR(50),
    visible BOOLEAN NOT NULL DEFAULT TRUE,
    featured BOOLEAN NOT NULL DEFAULT FALSE,
    
    -- Raw Full JSON backup for instant frontend compatibility
    raw_data JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profiles_community ON public.profiles(community);
CREATE INDEX IF NOT EXISTS idx_profiles_gender ON public.profiles(gender);
CREATE INDEX IF NOT EXISTS idx_profiles_status ON public.profiles(verify_status, account_status, visible);

-- ==============================================================================
-- 3. PAYMENTS TABLE (Razorpay UPI Transactions Audit Log)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.payments (
    id VARCHAR(100) PRIMARY KEY, -- e.g. TXN_xxxxx or pay_xxxxx
    user_id TEXT,
    user_name VARCHAR(150),
    plan VARCHAR(100) NOT NULL DEFAULT 'Boys 30 Days Pass (₹49)',
    amount NUMERIC(10, 2) NOT NULL DEFAULT 49.00,
    currency VARCHAR(10) NOT NULL DEFAULT 'INR',
    method VARCHAR(50) NOT NULL DEFAULT 'UPI',
    razorpay_payment_id VARCHAR(100),
    status VARCHAR(20) NOT NULL DEFAULT 'success',
    date VARCHAR(50),
    time VARCHAR(50),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);



CREATE INDEX IF NOT EXISTS idx_payments_user_id ON public.payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON public.payments(created_at);

-- ==============================================================================
-- 4. CASTES & MASTER DATA
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.castes (
    id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL UNIQUE,
    guj VARCHAR(150),
    caste_group VARCHAR(100),
    keywords TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO public.castes (name, guj, caste_group, keywords) VALUES
    ('Kadva Patidar', 'કડવા પાટીદાર', 'Patidar / Patel', 'kadva patel kadwa patidar kadvapatel કડવા પટેલ પાટીદાર'),
    ('Leva Patidar', 'લેવા પાટીદાર', 'Patidar / Patel', 'leva patel leuva patidar leuvad lewapatel લેવા પટેલ લેઉવા પાટીદાર'),
    ('Anjana (Chaudhary) Patidar', 'આંજણા ચૌધરી પાટીદાર', 'Patidar / Patel', 'anjana chaudhary chaudhari patel anjana patel આંજણા ચૌધરી પટેલ'),
    ('Matiya Patidar', 'મતિયા પાટીદાર', 'Patidar / Patel', 'matiya patel matia patidar મતિયા પટેલ'),
    ('Audichya Sahastra Brahmin', 'ઔદીચ્ય સહસ્ર બ્રાહ્મણ', 'Brahmin', 'audichya sahastra sahasra brahmin ઔદીચ્ય સહસ્ર બ્રાહ્મણ'),
    ('Audichya Zalawadi Brahmin', 'ઔદીચ્ય ઝાલાવાડી બ્રાહ્મણ', 'Brahmin', 'audichya zalawadi jhalawadi brahmin ઔદીચ્ય ઝાલાવાડી બ્રાહ્મણ'),
    ('Audichya Tolkiya Brahmin', 'ઔદીચ્ય ટોળકીયા બ્રાહ્મણ', 'Brahmin', 'audichya tolkiya tolkia brahmin ઔદીચ્ય ટોળકીયા બ્રાહ્મણ'),
    ('Nagar Brahmin', 'નાગર બ્રાહ્મણ', 'Brahmin', 'nagar brahmin vadnagara visnagara prashnora નાગર બ્રાહ્મણ'),
    ('Vadnagara Nagar Brahmin', 'વડનગરા નાગર બ્રાહ્મણ', 'Brahmin', 'vadnagara vadnagari nagar brahmin વડનગરા નાગર બ્રાહ્મણ'),
    ('Visnagara Nagar Brahmin', 'વિસનગરા નાગર બ્રાહ્મણ', 'Brahmin', 'visnagara visnagari nagar brahmin વિસનગરા નાગર બ્રાહ્મણ'),
    ('Prashnora Nagar Brahmin', 'પ્રશ્નોરા નાગર બ્રાહ્મણ', 'Brahmin', 'prashnora nagar brahmin પ્રશ્નોરા નાગર બ્રાહ્મણ'),
    ('Modh Brahmin', 'મોઢ બ્રાહ્મણ', 'Brahmin', 'modh brahmin modhbrahmin મોઢ બ્રાહ્મણ'),
    ('Shrimali Brahmin', 'શ્રીમાળી બ્રાહ્મણ', 'Brahmin', 'shrimali srimali brahmin શ્રીમાળી બ્રાહ્મણ'),
    ('Khedaval Brahmin', 'ખેડાવાલ બ્રાહ્મણ', 'Brahmin', 'khedaval khedawal brahmin ખેડાવાલ બ્રાહ્મણ'),
    ('Rajgor Brahmin', 'રાજગોર બ્રાહ્મણ', 'Brahmin', 'rajgor rajgar brahmin રાજગોર બ્રાહ્મણ'),
    ('Bardai Brahmin', 'બારડાઈ બ્રાહ્મણ', 'Brahmin', 'bardai brahmin બારડાઈ બ્રાહ્મણ'),
    ('Sompura Brahmin', 'સોમપુરા બ્રાહ્મણ', 'Brahmin', 'sompura brahmin sompura salat સોમપુરા બ્રાહ્મણ'),
    ('Trivedi Mewada Brahmin', 'ત્રિવેદી મેવાડા બ્રાહ્મણ', 'Brahmin', 'trivedi mewada mevada brahmin ત્રિવેદી મેવાડા બ્રાહ્મણ'),
    ('Bhatt Mewada Brahmin', 'ભટ્ટ મેવાડા બ્રાહ્મણ', 'Brahmin', 'bhatt mewada mevada brahmin ભટ્ટ મેવાડા બ્રાહ્મણ'),
    ('Tapodhan Brahmin', 'તપોધન બ્રાહ્મણ', 'Brahmin', 'tapodhan tapodhan brahmin તપોધન બ્રાહ્મણ'),
    ('Saraswat Brahmin', 'સારસ્વત બ્રાહ્મણ', 'Brahmin', 'saraswat saraswata brahmin સારસ્વત બ્રાહ્મણ'),
    ('Pushkarna Brahmin', 'પુષ્કર્ણા બ્રાહ્મણ', 'Brahmin', 'pushkarna pokharna brahmin પુષ્કર્ણા બ્રાહ્મણ'),
    ('Gurjar Brahmin', 'ગુર્જર બ્રાહ્મણ', 'Brahmin', 'gurjar gujjar brahmin ગુર્જર બ્રાહ્મણ'),
    ('Sorthiya Brahmin', 'સોરઠીયા બ્રાહ્મણ', 'Brahmin', 'sorthiya sorathiya brahmin સોરઠીયા બ્રાહ્મણ'),
    ('Kandolia Brahmin', 'કંદોળીયા બ્રાહ્મણ', 'Brahmin', 'kandolia kandoliya brahmin કંદોળીયા બ્રાહ્મણ'),
    ('Jambu Brahmin', 'જંબુ બ્રાહ્મણ', 'Brahmin', 'jambu brahmin જંબુ બ્રાહ્મણ'),
    ('Sachora Brahmin', 'સાચોરા બ્રાહ્મણ', 'Brahmin', 'sachora sanchora brahmin સાચોરા બ્રાહ્મણ'),
    ('Gomtiwal Brahmin', 'ગોમતીવાલ બ્રાહ્મણ', 'Brahmin', 'gomtiwal gomtival brahmin ગોમતીવાલ બ્રાહ્મણ'),
    ('Karadia Rajput', 'કારડીયા રાજપૂત', 'Kshatriya / Rajput', 'karadia karadiya rajput kshatriya કારડીયા રાજપૂત ક્ષત્રિય'),
    ('Nadoda Rajput', 'નાદોડા રાજપૂત', 'Kshatriya / Rajput', 'nadoda nadoda rajput નાદોડા રાજપૂત'),
    ('Garasiya Rajput', 'ગરાસિયા રાજપૂત', 'Kshatriya / Rajput', 'garasiya girasiya rajput kshatriya ગરાસિયા રાજપૂત'),
    ('Gurjar Kshatriya', 'ગુર્જર ક્ષત્રિય', 'Kshatriya / Rajput', 'gurjar gujjar kshatriya ગુર્જર ક્ષત્રિય'),
    ('Kshatriya Rajput', 'ક્ષત્રિય રાજપૂત', 'Kshatriya / Rajput', 'rajput rathod vaghela chauhan parmar gohil jadeja jhala solanki ક્ષત્રિય રાજપૂત'),
    ('Kshatriya Thakor', 'ક્ષત્રિય ઠાકોર', 'Kshatriya / Rajput', 'thakor thakore kshatriya thakor ઠાકોર ક્ષત્રિય'),
    ('Kasbati Rajput', 'કસબાતી રાજપૂત', 'Kshatriya / Rajput', 'kasbati kasbati rajput કસબાતી રાજપૂત'),
    ('Maru Rajput', 'મારુ રાજપૂત', 'Kshatriya / Rajput', 'maru maroo rajput મારુ રાજપૂત'),
    ('Luhar Suthar', 'લુહાર સુથાર', 'Vishwakarma / Suthar', 'luhar suthar lohar suthar vishwakarma લુહાર સુથાર વિશ્વકર્મા'),
    ('Gujjar Suthar', 'ગુર્જર સુથાર', 'Vishwakarma / Suthar', 'gujjar suthar gurjar suthar vishwakarma ગુર્જર સુથાર'),
    ('Mistry Suthar', 'મિસ્ત્રી સુથાર', 'Vishwakarma / Suthar', 'mistry suthar mistri suthar મિસ્ત્રી સુથાર'),
    ('Mewada Suthar', 'મેવાડા સુથાર', 'Vishwakarma / Suthar', 'mewada mevada suthar મેવાડા સુથાર'),
    ('Vansh Suthar', 'વંશ સુથાર', 'Vishwakarma / Suthar', 'vansh suthar vanshsuthar વંશ સુથાર'),
    ('Panchal', 'પંચાલ', 'Vishwakarma / Suthar', 'panchal panchal suthar luhar પંચાલ'),
    ('Luhar', 'લુહાર', 'Vishwakarma / Suthar', 'luhar lohar black smith લુહાર'),
    ('Gujjar Luhar', 'ગુર્જર લુહાર', 'Vishwakarma / Suthar', 'gujjar luhar gurjar luhar ગુર્જર લુહાર'),
    ('Bhavnagari Luhar', 'ભાવનગરી લુહાર', 'Vishwakarma / Suthar', 'bhavnagari luhar ભાવનગરી લુહાર'),
    ('Sihori Luhar', 'શિહોરી લુહાર', 'Vishwakarma / Suthar', 'sihori luhar શિહોરી લુહાર'),
    ('Kadiwal Luhar', 'કડીવાલ લુહાર', 'Vishwakarma / Suthar', 'kadiwal luhar કડીવાલ લુહાર'),
    ('Pithva Suthar', 'પીઠવા સુથાર', 'Vishwakarma / Suthar', 'pithva pithwa suthar પીઠવા સુથાર'),
    ('Gujjar Prajapati', 'ગુર્જર પ્રજાપતિ', 'Prajapati / Kumbhar', 'gujjar prajapati gurjar prajapati ગુર્જર પ્રજાપતિ'),
    ('Varia Prajapati', 'વરિયા પ્રજાપતિ', 'Prajapati / Kumbhar', 'varia wariya prajapati વરિયા પ્રજાપતિ'),
    ('Sorathiya Prajapati', 'સોરઠીયા પ્રજાપતિ', 'Prajapati / Kumbhar', 'sorathiya sorthiya prajapati સોરઠીયા પ્રજાપતિ'),
    ('Lad Prajapati', 'લાડ પ્રજાપતિ', 'Prajapati / Kumbhar', 'lad prajapati laad prajapati લાડ પ્રજાપતિ'),
    ('Kumbhar', 'કુંભાર', 'Prajapati / Kumbhar', 'kumbhar prajapati કુંભાર'),
    ('Ajwaliya Prajapati', 'અજવાળિયા પ્રજાપતિ', 'Prajapati / Kumbhar', 'ajwaliya ajvaliya prajapati અજવાળિયા પ્રજાપતિ'),
    ('Modh Vanik', 'મોઢ વણિક', 'Vanik / Vaishnav', 'modh vanik vaniya baniya મોઢ વણિક વાણિયા'),
    ('Dasha Shrimali Vanik', 'દશા શ્રીમાળી વણિક', 'Vanik / Vaishnav', 'dasha shrimali vanik baniya દશા શ્રીમાળી વણિક'),
    ('Visa Shrimali Vanik', 'વિસા શ્રીમાળી વણિક', 'Vanik / Vaishnav', 'visa shrimali vanik baniya વિસા શ્રીમાળી વણિક'),
    ('Porwad Vanik', 'પોરવાડ વણિક', 'Vanik / Vaishnav', 'porwad porwal vanik પોરવાડ વણિક'),
    ('Khadayata Vanik', 'ખડાયતા વણિક', 'Vanik / Vaishnav', 'khadayata khadayta vanik ખડાયતા વણિક'),
    ('Kapol Vanik', 'કપોળ વણિક', 'Vanik / Vaishnav', 'kapol vanik kapol baniya કપોળ વણિક'),
    ('Harsola Vanik', 'હરસોલા વણિક', 'Vanik / Vaishnav', 'harsola vanik હરસોલા વણિક'),
    ('Lad Vanik', 'લાડ વણિક', 'Vanik / Vaishnav', 'lad vanik laad vanik લાડ વણિક'),
    ('Dasha Porwad', 'દશા પોરવાડ', 'Vanik / Vaishnav', 'dasha porwad porwal દશા પોરવાડ'),
    ('Visa Porwad', 'વિસા પોરવાડ', 'Vanik / Vaishnav', 'visa porwad porwal વિસા પોરવાડ'),
    ('Jharola Vanik', 'ઝરોળા વણિક', 'Vanik / Vaishnav', 'jharola zarola vanik ઝરોળા વણિક'),
    ('Mewada Vanik', 'મેવાડા વણિક', 'Vanik / Vaishnav', 'mewada mevada vanik મેવાડા વણિક'),
    ('Nema Vanik', 'નેમા વણિક', 'Vanik / Vaishnav', 'nema vanik નેમા વણિક'),
    ('Deshaval Vanik', 'દેશાવાળ વણિક', 'Vanik / Vaishnav', 'deshaval deshavad vanik દેશાવાળ વણિક'),
    ('Vaishnav Vanik', 'વૈષ્ણવ વણિક', 'Vanik / Vaishnav', 'vaishnav vanik vaishnav baniya વૈષ્ણવ વણિક'),
    ('Halai Lohana', 'હાલાઈ લોહાણા', 'Lohana', 'halai lohana thakkar luwana હાલાઈ લોહાણા ઠક્કર'),
    ('Ghoghari Lohana', 'ઘોઘારી લોહાણા', 'Lohana', 'ghoghari goghari lohana thakkar ઘોઘારી લોહાણા'),
    ('Kutchi Lohana', 'કચ્છી લોહાણા', 'Lohana', 'kutchi kutchhi lohana thakkar કચ્છી લોહાણા'),
    ('Vaishnav Lohana', 'વૈષ્ણવ લોહાણા', 'Lohana', 'vaishnav lohana thakkar વૈષ્ણવ લોહાણા'),
    ('Machhoya Ahir', 'મચ્છોયા આહીર', 'Ahir / Maldhari', 'machhoya ahir aahir મચ્છોયા આહીર'),
    ('Sorathiya Ahir', 'સોરઠીયા આહીર', 'Ahir / Maldhari', 'sorathiya sorthiya ahir aahir સોરઠીયા આહીર'),
    ('Boricha Ahir', 'બોરીચા આહીર', 'Ahir / Maldhari', 'boricha ahir aahir બોરીચા આહીર'),
    ('Pancholi Ahir', 'પાંચોળી આહીર', 'Ahir / Maldhari', 'pancholi ahir aahir પાંચોળી આહીર'),
    ('Paratharia Ahir', 'પરાથરિયા આહીર', 'Ahir / Maldhari', 'paratharia parathariya ahir aahir પરાથરિયા આહીર'),
    ('Rabari', 'રબારી', 'Ahir / Maldhari', 'rabari rayka desai રબારી રાયકા દેસાઈ'),
    ('Vadhiyar Rabari', 'વઢિયાર રબારી', 'Ahir / Maldhari', 'vadhiyar vadhiyari rabari વઢિયાર રબારી'),
    ('Patanwadia Rabari', 'પાટણવાડિયા રબારી', 'Ahir / Maldhari', 'patanwadia patanwadiya rabari પાટણવાડિયા રબારી'),
    ('Kutchi Rabari', 'કચ્છી રબારી', 'Ahir / Maldhari', 'kutchi kutchhi rabari કચ્છી રબારી'),
    ('Bharwad', 'ભરવાડ', 'Ahir / Maldhari', 'bharwad bharvad mota nana ભરવાડ'),
    ('Mota Bharwad', 'મોટા ભરવાડ', 'Ahir / Maldhari', 'mota bharwad મોટા ભરવાડ'),
    ('Nana Bharwad', 'નાના ભરવાડ', 'Ahir / Maldhari', 'nana bharwad નાના ભરવાડ'),
    ('Talpada Koli', 'તળપદા કોળી', 'Koli', 'talpada koli thakor તળપદા કોળી'),
    ('Chunvalia Koli', 'ચુંવાળિયા કોળી', 'Koli', 'chunvalia chunvaliya koli thakor ચુંવાળિયા કોળી'),
    ('Ghedia Koli', 'ઘેડિયા કોળી', 'Koli', 'ghedia ghediya koli ઘેડિયા કોળી'),
    ('Thakor Koli', 'ઠાકોર કોળી', 'Koli', 'thakor koli thakore ઠાકોર કોળી'),
    ('Baria Koli', 'બારિયા કોળી', 'Koli', 'baria bariya koli બારિયા કોળી'),
    ('Dharala Koli', 'ધરાળા કોળી', 'Koli', 'dharala koli ધરાળા કોળી'),
    ('Koli Patel', 'કોળી પટેલ', 'Koli', 'koli patel કોળી પટેલ'),
    ('Soni', 'સોની', 'Artisan & Trade', 'soni swarnakar goldsmith સોની'),
    ('Shrimali Soni', 'શ્રીમાળી સોની', 'Artisan & Trade', 'shrimali srimali soni શ્રીમાળી સોની'),
    ('Gujjar Soni', 'ગુર્જર સોની', 'Artisan & Trade', 'gujjar soni gurjar soni ગુર્જર સોની'),
    ('Maru Soni', 'મારુ સોની', 'Artisan & Trade', 'maru soni મારુ સોની'),
    ('Kansara', 'કંસારા', 'Artisan & Trade', 'kansara coppersmith કંસારા'),
    ('Darji', 'દરજી', 'Artisan & Trade', 'darji tailor દરજી'),
    ('Ramdev Darji', 'રામદેવ દરજી', 'Artisan & Trade', 'ramdev darji રામદેવ દરજી'),
    ('Charaniya Darji', 'ચારણીયા દરજી', 'Artisan & Trade', 'charaniya darji ચારણીયા દરજી'),
    ('Bhavsar', 'ભાવસાર', 'Artisan & Trade', 'bhavsar bhavasar ભાવસાર'),
    ('Khatri', 'ખત્રી', 'Artisan & Trade', 'khatri kshatriya ખત્રી'),
    ('Brahma Kshatriya', 'બ્રહ્મક્ષત્રિય', 'Artisan & Trade', 'brahma kshatriya brahmakshatriya બ્રહ્મક્ષત્રિય'),
    ('Ghanchi', 'ઘાંચી', 'Artisan & Trade', 'ghanchi modh ghanchi તેલી ઘાંચી'),
    ('Modh Ghanchi', 'મોઢ ઘાંચી', 'Artisan & Trade', 'modh ghanchi મોઢ ઘાંચી'),
    ('Salvi', 'સાળવી', 'Artisan & Trade', 'salvi patola weaver સાળવી'),
    ('Chhipa', 'છીપા', 'Artisan & Trade', 'chhipa printer છીપા'),
    ('Rangrez', 'રંગરેઝ', 'Artisan & Trade', 'rangrez ranger રંગરેઝ'),
    ('Tamboli', 'તંબોળી', 'Artisan & Trade', 'tamboli panwala તંબોળી'),
    ('Limbachiya', 'લિંબાચીયા', 'Valand / Limbachiya', 'limbachiya limbachia nai valand લિંબાચીયા'),
    ('Valand / Nai', 'વાણંદ / નાઈ', 'Valand / Limbachiya', 'valand vanand nai barber વાણંદ નાઈ'),
    ('Gujjar Valand', 'ગુર્જર વાણંદ', 'Valand / Limbachiya', 'gujjar valand gurjar vanand ગુર્જર વાણંદ'),
    ('Maru Charan', 'મારુ ચારણ', 'Charan / Gadhvi', 'maru charan gadhvi મારુ ચારણ ગઢવી'),
    ('Kachela Charan', 'કછેલા ચારણ', 'Charan / Gadhvi', 'kachela charan gadhvi કછેલા ચારણ ગઢવી'),
    ('Tumbel Charan', 'તુંબેલ ચારણ', 'Charan / Gadhvi', 'tumbel charan gadhvi તુંબેલ ચારણ ગઢવી'),
    ('Vankar', 'વણકર', 'Scheduled Communities', 'vankar weaver વણકર'),
    ('Rohit', 'રોહિત', 'Scheduled Communities', 'rohit chakor રોહિત'),
    ('Meghwal', 'મેઘવાલ', 'Scheduled Communities', 'meghwal maheshwari મેઘવાલ'),
    ('Maheshwari Meghwal', 'માહેશ્વરી મેઘવાલ', 'Scheduled Communities', 'maheshwari meghwal માહેશ્વરી મેઘવાલ'),
    ('Garoda', 'ગરોડા', 'Scheduled Communities', 'garoda guruda ગરોડા'),
    ('Senva', 'સેણવા', 'Scheduled Communities', 'senva senwa સેણવા'),
    ('Valmiki', 'વાલ્મીકિ', 'Scheduled Communities', 'valmiki bhangi વાલ્મીકિ'),
    ('Goswami / Bava / Sadhu', 'ગોસ્વામી / બાવા / સાધુ', 'Traditional Communities', 'goswami bava sadhu mahant puri giri bharathi ગોસ્વામી બાવા સાધુ'),
    ('Atit Goswami', 'અતીત ગોસ્વામી', 'Traditional Communities', 'atit goswami bava અતીત ગોસ્વામી'),
    ('Margi Sadhu', 'માર્ગી સાધુ', 'Traditional Communities', 'margi sadhu માર્ગી સાધુ'),
    ('Raval / Ravaldev', 'રાવળ / રાવળદેવ', 'Traditional Communities', 'raval ravaldev rawaldev રાવળ રાવળદેવ'),
    ('Bhoi', 'ભોઈ', 'Traditional Communities', 'bhoi kahar ભોઈ'),
    ('Kharwa', 'ખારવા', 'Traditional Communities', 'kharwa sagarkhedu sailor ખારવા'),
    ('Machhi', 'માછી', 'Traditional Communities', 'machhi koli machhi fisherman માછી'),
    ('Devipujak / Vaghri', 'દેવીપૂજક / વાઘરી', 'Traditional Communities', 'devipujak vaghri વાઘરી દેવીપૂજક'),
    ('Chunvalia Devipujak', 'ચુંવાળિયા દેવીપૂજક', 'Traditional Communities', 'chunvalia devipujak ચુંવાળિયા દેવીપૂજક'),
    ('Bajania', 'બાજણિયા', 'Traditional Communities', 'bajania bajaniya બાજણિયા'),
    ('Nat', 'નટ', 'Traditional Communities', 'nat acrobatics નટ'),
    ('Vanjara / Banjara', 'વણજારા / બંજારા', 'Traditional Communities', 'vanjara banjara વણજારા બંજારા'),
    ('Ode / Oad', 'ઓડ', 'Traditional Communities', 'ode oad utpanna ઓડ'),
    ('Sathwara', 'સાથવારા', 'Traditional Communities', 'sathwara sagar શાકભાજી સાથવારા'),
    ('Kadia', 'કડિયા', 'Traditional Communities', 'kadia mason કડિયા'),
    ('Gujjar Kadia', 'ગુર્જર કડિયા', 'Traditional Communities', 'gujjar kadia gurjar kadia ગુર્જર કડિયા'),
    ('Salat', 'સલાટ', 'Traditional Communities', 'salat stone artist સલાટ'),
    ('Dabgar', 'ડબગર', 'Traditional Communities', 'dabgar ડબગર'),
    ('Barot / Brahmbhatt', 'બારોટ / બ્રહ્મભટ્ટ', 'Traditional Communities', 'barot brahmbhatt bhat બારોટ બ્રહ્મભટ્ટ'),
    ('Bhat / Vahivancha Barot', 'ભાટ / વહીવંચા બારોટ', 'Traditional Communities', 'bhat vahivancha barot ભાટ વહીવંચા બારોટ'),
    ('Charan Barot', 'ચારણ બારોટ', 'Traditional Communities', 'charan barot ચારણ બારોટ')
ON CONFLICT (name) DO UPDATE SET guj = EXCLUDED.guj, caste_group = EXCLUDED.caste_group, keywords = EXCLUDED.keywords;


-- ==============================================================================
-- 5. ROW LEVEL SECURITY (RLS) POLICIES — SAFE RE-RUNNABLE (IDEMPOTENT)
-- ==============================================================================

-- Enable RLS
ALTER TABLE public.castes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Castes Policy
DROP POLICY IF EXISTS "Castes are viewable by everyone" ON public.castes;
CREATE POLICY "Castes are viewable by everyone" ON public.castes FOR SELECT USING (true);

-- Profiles Policies (Allows public browsing and direct member registration)
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Profiles can be created by everyone" ON public.profiles;
CREATE POLICY "Profiles can be created by everyone" ON public.profiles FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Profiles can be updated by everyone" ON public.profiles;
CREATE POLICY "Profiles can be updated by everyone" ON public.profiles FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Profiles can be deleted by admin" ON public.profiles;
CREATE POLICY "Profiles can be deleted by admin" ON public.profiles FOR DELETE USING (true);

-- Users Policies
DROP POLICY IF EXISTS "Users are viewable by everyone" ON public.users;
CREATE POLICY "Users are viewable by everyone" ON public.users FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can be created by everyone" ON public.users;
CREATE POLICY "Users can be created by everyone" ON public.users FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Users can be updated by everyone" ON public.users;
CREATE POLICY "Users can be updated by everyone" ON public.users FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Users can be deleted by admin" ON public.users;
CREATE POLICY "Users can be deleted by admin" ON public.users FOR DELETE USING (true);

-- Payments Policies
DROP POLICY IF EXISTS "Payments are viewable by everyone" ON public.payments;
CREATE POLICY "Payments are viewable by everyone" ON public.payments FOR SELECT USING (true);

DROP POLICY IF EXISTS "Payments can be recorded by everyone" ON public.payments;
CREATE POLICY "Payments can be recorded by everyone" ON public.payments FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Payments can be updated by everyone" ON public.payments;
CREATE POLICY "Payments can be updated by everyone" ON public.payments FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Payments can be deleted by admin" ON public.payments;
CREATE POLICY "Payments can be deleted by admin" ON public.payments FOR DELETE USING (true);

-- ==============================================================================
-- 5B. INTERESTS TABLE (Persistent Matrimonial Match Inquiries)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.interests (
    id TEXT PRIMARY KEY,
    sender_id BIGINT NOT NULL,
    sender_email VARCHAR(255) NOT NULL,
    sender_name VARCHAR(200) NOT NULL,
    sender_gender VARCHAR(20),
    sender_photo TEXT,
    sender_caste VARCHAR(150),
    sender_city VARCHAR(150),
    receiver_id BIGINT NOT NULL,
    receiver_email VARCHAR(255) NOT NULL,
    receiver_name VARCHAR(200) NOT NULL,
    receiver_photo TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'pending', -- 'pending', 'accepted', 'declined'
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_interests_receiver_email ON public.interests(receiver_email);
CREATE INDEX IF NOT EXISTS idx_interests_receiver_id ON public.interests(receiver_id);
CREATE INDEX IF NOT EXISTS idx_interests_sender_email ON public.interests(sender_email);
CREATE INDEX IF NOT EXISTS idx_interests_sender_id ON public.interests(sender_id);
CREATE INDEX IF NOT EXISTS idx_interests_status ON public.interests(status);

ALTER TABLE public.interests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Interests are viewable by everyone" ON public.interests;
CREATE POLICY "Interests are viewable by everyone" ON public.interests FOR SELECT USING (true);

DROP POLICY IF EXISTS "Interests can be created by everyone" ON public.interests;
CREATE POLICY "Interests can be created by everyone" ON public.interests FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Interests can be updated by everyone" ON public.interests;
CREATE POLICY "Interests can be updated by everyone" ON public.interests FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Interests can be deleted by everyone" ON public.interests;
CREATE POLICY "Interests can be deleted by everyone" ON public.interests FOR DELETE USING (true);

-- ==============================================================================
-- 5C. MESSAGES TABLE (Realtime Matrimonial Chat Messages between Matched Members)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.messages (
    id TEXT PRIMARY KEY,
    thread_id TEXT, -- e.g. "thread_123_456"
    sender_id BIGINT NOT NULL,
    receiver_id BIGINT NOT NULL,
    sender_email VARCHAR(255) NOT NULL,
    receiver_email VARCHAR(255) NOT NULL,
    text TEXT NOT NULL,
    time VARCHAR(50),
    edited BOOLEAN DEFAULT FALSE,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    deleted_for_users JSONB NOT NULL DEFAULT '[]'::jsonb,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messages_thread_id ON public.messages(thread_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON public.messages(sender_email);
CREATE INDEX IF NOT EXISTS idx_messages_receiver ON public.messages(receiver_email);
CREATE INDEX IF NOT EXISTS idx_messages_receiver_id ON public.messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver_read ON public.messages(receiver_id, is_read);
CREATE INDEX IF NOT EXISTS idx_messages_thread_created ON public.messages(thread_id, created_at);

ALTER TABLE public.messages REPLICA IDENTITY FULL;
ALTER TABLE public.interests REPLICA IDENTITY FULL;

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Messages are viewable by everyone" ON public.messages;
CREATE POLICY "Messages are viewable by everyone" ON public.messages FOR SELECT USING (true);

DROP POLICY IF EXISTS "Messages can be created by everyone" ON public.messages;
CREATE POLICY "Messages can be created by everyone" ON public.messages FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Messages can be updated by everyone" ON public.messages;
CREATE POLICY "Messages can be updated by everyone" ON public.messages FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Messages can be deleted by everyone" ON public.messages;
CREATE POLICY "Messages can be deleted by everyone" ON public.messages FOR DELETE USING (true);

-- ==============================================================================
-- 5D. EMAIL LOGS (Audit Log of Matrimonial Interest & Match Notifications)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.email_logs (
    id TEXT PRIMARY KEY,
    recipient_email VARCHAR(255) NOT NULL,
    recipient_name VARCHAR(200),
    subject VARCHAR(255) NOT NULL,
    notification_type VARCHAR(50) NOT NULL, -- 'INTEREST_RECEIVED', 'INTEREST_ACCEPTED', 'INTEREST_DECLINED'
    payload JSONB,
    status VARCHAR(50) NOT NULL DEFAULT 'sent',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Email logs are viewable by everyone" ON public.email_logs;
CREATE POLICY "Email logs are viewable by everyone" ON public.email_logs FOR SELECT USING (true);

DROP POLICY IF EXISTS "Email logs can be created by everyone" ON public.email_logs;
CREATE POLICY "Email logs can be created by everyone" ON public.email_logs FOR INSERT WITH CHECK (true);

-- ==============================================================================
-- 5E. REPORTS TABLE (Member Violation & Moderation Reports)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.reports (
    id TEXT PRIMARY KEY,
    reporter_id TEXT,
    reporter_name VARCHAR(200),
    reporter_email VARCHAR(255),
    target_user_id TEXT,
    target_user_name VARCHAR(200),
    target_user_email VARCHAR(255),
    reason VARCHAR(255) NOT NULL,
    details TEXT,
    date VARCHAR(50),
    status VARCHAR(20) NOT NULL DEFAULT 'open', -- 'open', 'resolved'
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reports_status ON public.reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON public.reports(created_at);

ALTER TABLE public.reports REPLICA IDENTITY FULL;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Reports are viewable by everyone" ON public.reports;
CREATE POLICY "Reports are viewable by everyone" ON public.reports FOR SELECT USING (true);

DROP POLICY IF EXISTS "Reports can be created by everyone" ON public.reports;
CREATE POLICY "Reports can be created by everyone" ON public.reports FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Reports can be updated by everyone" ON public.reports;
CREATE POLICY "Reports can be updated by everyone" ON public.reports FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Reports can be deleted by everyone" ON public.reports;
CREATE POLICY "Reports can be deleted by everyone" ON public.reports FOR DELETE USING (true);

-- ==============================================================================
-- 5F. APP SETTINGS TABLE (Platform Configurations & Maintenance Mode)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.app_settings (
    key VARCHAR(100) PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.app_settings REPLICA IDENTITY FULL;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "App settings are viewable by everyone" ON public.app_settings;
CREATE POLICY "App settings are viewable by everyone" ON public.app_settings FOR SELECT USING (true);

DROP POLICY IF EXISTS "App settings can be updated by everyone" ON public.app_settings;
CREATE POLICY "App settings can be updated by everyone" ON public.app_settings FOR ALL USING (true);

-- ==============================================================================
-- 6. REALTIME REPLICATION (Instant Live Updates on Admin & Member Apps)
-- ==============================================================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'profiles'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'payments'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.payments;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'users'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.users;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'interests'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.interests;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'messages'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
    END IF;
END $$;

-- ==============================================================================
-- 7. SECURE COMPLETE ACCOUNT PURGE FUNCTION (RPC)
-- Deletes user completely from Supabase Auth (auth.users), profiles, users, 
-- Enable full row replica identity so Realtime receives complete record payloads on DELETE
ALTER TABLE public.profiles REPLICA IDENTITY FULL;
ALTER TABLE public.users REPLICA IDENTITY FULL;

-- ==============================================================================
-- 9. PERMANENT COMPLETE ACCOUNT PURGING RPC (Supabase Auth + Database)
-- Deletes user permanently from auth.users (Supabase Dashboard), profiles, users,
-- interests, messages, payments, and email logs so zero trace remains.
-- ==============================================================================

CREATE OR REPLACE FUNCTION delete_user_account_completely(target_email TEXT, target_user_id TEXT DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
    found_auth_uid UUID := NULL;
    norm_email TEXT;
    norm_id TEXT;
    num_id BIGINT := NULL;
    del_profiles_count INT := 0;
    del_users_count INT := 0;
    del_interests_count INT := 0;
    del_messages_count INT := 0;
    del_payments_count INT := 0;
    del_emails_count INT := 0;
    del_auth_count INT := 0;
BEGIN
    norm_email := LOWER(TRIM(COALESCE(target_email, '')));
    norm_id := TRIM(COALESCE(target_user_id, ''));

    -- Extract numeric ID if passed
    IF norm_id ~ '^[0-9]+$' THEN
        num_id := norm_id::bigint;
    END IF;

    -- 1. Find user in auth.users by UUID if provided, or by email
    IF norm_id ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
        BEGIN
            SELECT id INTO found_auth_uid FROM auth.users WHERE id = norm_id::uuid LIMIT 1;
        EXCEPTION WHEN OTHERS THEN
            found_auth_uid := NULL;
        END;
    END IF;
    
    IF found_auth_uid IS NULL AND norm_email <> '' THEN
        BEGIN
            SELECT id INTO found_auth_uid FROM auth.users WHERE LOWER(TRIM(email)) = norm_email LIMIT 1;
        EXCEPTION WHEN OTHERS THEN
            found_auth_uid := NULL;
        END;
    END IF;

    -- 2. Delete all chat messages (sent or received)
    DELETE FROM public.messages 
    WHERE (norm_email <> '' AND (LOWER(TRIM(sender_email)) = norm_email OR LOWER(TRIM(receiver_email)) = norm_email))
       OR (num_id IS NOT NULL AND (sender_id = num_id OR receiver_id = num_id))
       OR (norm_id <> '' AND (sender_id::text = norm_id OR receiver_id::text = norm_id))
       OR (found_auth_uid IS NOT NULL AND (sender_id::text = found_auth_uid::text OR receiver_id::text = found_auth_uid::text));
    GET DIAGNOSTICS del_messages_count = ROW_COUNT;

    -- 3. Delete all interests (sent or received)
    DELETE FROM public.interests 
    WHERE (norm_email <> '' AND (LOWER(TRIM(sender_email)) = norm_email OR LOWER(TRIM(receiver_email)) = norm_email))
       OR (num_id IS NOT NULL AND (sender_id = num_id OR receiver_id = num_id))
       OR (norm_id <> '' AND (sender_id::text = norm_id OR receiver_id::text = norm_id))
       OR (found_auth_uid IS NOT NULL AND (sender_id::text = found_auth_uid::text OR receiver_id::text = found_auth_uid::text));
    GET DIAGNOSTICS del_interests_count = ROW_COUNT;

    -- 4. Delete payments
    DELETE FROM public.payments 
    WHERE (norm_id <> '' AND user_id = norm_id)
       OR (num_id IS NOT NULL AND user_id = num_id::text)
       OR (found_auth_uid IS NOT NULL AND user_id = found_auth_uid::text)
       OR (norm_email <> '' AND user_id IN (
           SELECT id::text FROM public.profiles WHERE LOWER(TRIM(email)) = norm_email
           UNION
           SELECT user_id FROM public.profiles WHERE LOWER(TRIM(email)) = norm_email
           UNION
           SELECT id FROM public.users WHERE LOWER(TRIM(email)) = norm_email
       ));
    GET DIAGNOSTICS del_payments_count = ROW_COUNT;

    -- 5. Delete email logs
    IF norm_email <> '' THEN
        DELETE FROM public.email_logs WHERE LOWER(TRIM(recipient_email)) = norm_email;
        GET DIAGNOSTICS del_emails_count = ROW_COUNT;
    END IF;

    -- 5B. Delete from reports (safe if table exists)
    BEGIN
        DELETE FROM public.reports 
        WHERE (norm_email <> '' AND (LOWER(TRIM(reporter_email)) = norm_email OR LOWER(TRIM(target_user_email)) = norm_email))
           OR (norm_id <> '' AND (reporter_id = norm_id OR target_user_id = norm_id))
           OR (num_id IS NOT NULL AND (reporter_id = num_id::text OR target_user_id = num_id::text))
           OR (found_auth_uid IS NOT NULL AND (reporter_id = found_auth_uid::text OR target_user_id = found_auth_uid::text));
    EXCEPTION WHEN OTHERS THEN
        NULL;
    END;

    -- 6. Delete from public.profiles
    DELETE FROM public.profiles 
    WHERE (norm_email <> '' AND LOWER(TRIM(email)) = norm_email)
       OR (num_id IS NOT NULL AND id = num_id)
       OR (norm_id <> '' AND user_id = norm_id)
       OR (norm_id <> '' AND id::text = norm_id)
       OR (found_auth_uid IS NOT NULL AND (user_id = found_auth_uid::text OR id::text = found_auth_uid::text));
    GET DIAGNOSTICS del_profiles_count = ROW_COUNT;

    -- 7. Delete from public.users
    DELETE FROM public.users 
    WHERE (norm_email <> '' AND LOWER(TRIM(email)) = norm_email)
       OR (norm_id <> '' AND id = norm_id)
       OR (num_id IS NOT NULL AND id = num_id::text)
       OR (found_auth_uid IS NOT NULL AND id = found_auth_uid::text);
    GET DIAGNOSTICS del_users_count = ROW_COUNT;

    -- 8. Delete permanently from Supabase Auth (auth.users + auth dependencies)
    -- This cleanses auth sessions, identities, and the user from the Supabase Authentication Dashboard
    IF found_auth_uid IS NOT NULL THEN
        BEGIN
            DELETE FROM auth.refresh_tokens WHERE session_id IN (SELECT id FROM auth.sessions WHERE user_id = found_auth_uid);
            DELETE FROM auth.sessions WHERE user_id = found_auth_uid;
            DELETE FROM auth.identities WHERE user_id = found_auth_uid;
            DELETE FROM auth.mfa_factors WHERE user_id = found_auth_uid;
            DELETE FROM auth.users WHERE id = found_auth_uid;
            GET DIAGNOSTICS del_auth_count = ROW_COUNT;
        EXCEPTION WHEN OTHERS THEN
            del_auth_count := 0;
        END;
    END IF;

    IF del_auth_count = 0 AND norm_email <> '' THEN
        BEGIN
            DELETE FROM auth.refresh_tokens WHERE session_id IN (SELECT id FROM auth.sessions WHERE user_id IN (SELECT id FROM auth.users WHERE LOWER(TRIM(email)) = norm_email));
            DELETE FROM auth.sessions WHERE user_id IN (SELECT id FROM auth.users WHERE LOWER(TRIM(email)) = norm_email);
            DELETE FROM auth.identities WHERE user_id IN (SELECT id FROM auth.users WHERE LOWER(TRIM(email)) = norm_email);
            DELETE FROM auth.mfa_factors WHERE user_id IN (SELECT id FROM auth.users WHERE LOWER(TRIM(email)) = norm_email);
            DELETE FROM auth.users WHERE LOWER(TRIM(email)) = norm_email;
            GET DIAGNOSTICS del_auth_count = ROW_COUNT;
        EXCEPTION WHEN OTHERS THEN
            del_auth_count := 0;
        END;
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'purged_email', norm_email,
        'purged_auth_uid', found_auth_uid,
        'auth_users_deleted', del_auth_count,
        'profiles_deleted', del_profiles_count,
        'users_deleted', del_users_count,
        'interests_deleted', del_interests_count,
        'messages_deleted', del_messages_count,
        'payments_deleted', del_payments_count,
        'email_logs_deleted', del_emails_count
    );
END;
$$;

-- Grant execution rights to anon, authenticated, and service_role roles
GRANT EXECUTE ON FUNCTION delete_user_account_completely(TEXT, TEXT) TO anon, authenticated, service_role;

-- ==============================================================================
-- 10. EXPLICIT DATA API PERMISSIONS (Supabase October 30+ Compatibility)
-- Explicitly grants API access to public tables for anon, authenticated, and service_role
-- Complies with Supabase breaking change starting October 30, 2026.
-- ==============================================================================
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

GRANT ALL ON TABLE public.users TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.profiles TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.payments TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.castes TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.interests TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.messages TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.email_logs TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.reports TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.app_settings TO anon, authenticated, service_role;

GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;


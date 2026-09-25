/* ============================================================
   ADMIN ANALYTICS PAGE — Supabase Live Database Connected
   Direct Supabase fetch: profiles + payments + community breakdown
   ============================================================ */

var analyticsPageState = {
    regTimeframe: '7days',
    revTimeframe: '7days'
};
window.analyticsPageState = analyticsPageState;

/* ---- Date helpers ---- */
function apGetStartDate(tf) {
    var now = new Date(); now.setHours(0,0,0,0);
    if (tf === 'today')  return new Date(now);
    if (tf === '7days')  { var d=new Date(now); d.setDate(d.getDate()-6); return d; }
    if (tf === '15days') { var d=new Date(now); d.setDate(d.getDate()-14); return d; }
    if (tf === '30days') { var d=new Date(now); d.setDate(d.getDate()-29); return d; }
    return new Date(now);
}

function apParseDate(str) {
    if (!str) return null;
    var d = new Date(str);
    if (!isNaN(d.getTime())) return d;
    var parts = str.trim().split(/\s+/);
    if (parts.length === 3) {
        var months = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'];
        var m = months.indexOf(parts[1].toLowerCase().slice(0,3));
        if (m !== -1) return new Date(+parts[2], m, +parts[0]);
    }
    return null;
}

function apFmtDate(d) {
    if (!d) return '';
    var mo = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    var hh=d.getHours(), mm=d.getMinutes(), ampm=hh>=12?'PM':'AM', h12=hh%12||12;
    return d.getDate()+' '+mo[d.getMonth()]+' '+d.getFullYear()+' '+h12+':'+String(mm).padStart(2,'0')+' '+ampm;
}

function apTfLabel(tf) {
    if (tf==='today') return 'Today';
    if (tf==='7days') return 'This Week';
    if (tf==='15days') return '15 Days';
    return 'This Month';
}

function apEsc(s) {
    return typeof escapeHtmlAdmin==='function'
        ? escapeHtmlAdmin(s)
        : String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function apPillsHtml(activeId, fn) {
    var opts=[{key:'today',label:'Today'},{key:'7days',label:'This Week'},{key:'15days',label:'15 Days'},{key:'30days',label:'This Month'}];
    return opts.map(function(o){
        return '<button class="ap-pill'+(activeId===o.key?' active':'')+'" onclick="'+fn+'(\''+o.key+'\')">'+o.label+'</button>';
    }).join('');
}

function apShowLoading(wrap) {
    if (!wrap) return;
    wrap.innerHTML = '<div class="ap-loading-state"><div class="ap-loader-ring"><div></div><div></div><div></div><div></div></div><div class="ap-loading-txt">Database ma thi data load thai rahu che...</div><div class="ap-loading-sub">Supabase PostgreSQL thi live data fetch thai rahu che</div></div>';
}

function apSetRegTf(tf) { analyticsPageState.regTimeframe=tf; renderAnalyticsPage(); }
window.apSetRegTf = apSetRegTf;

function apSetRevTf(tf) { analyticsPageState.revTimeframe=tf; renderAnalyticsPage(); }
window.apSetRevTf = apSetRevTf;

function apViewUser(id) { if (typeof openUserDetail==='function') openUserDetail(id); }
window.apViewUser = apViewUser;

/* ============================================================
   MAIN RENDER — Fetches LIVE from Supabase on every call
   ============================================================ */
async function renderAnalyticsPage(isManualRefresh) {
    var wrap = document.getElementById('analyticsPageContent');
    if (!wrap) return;
    if (typeof buildTabbar === 'function') buildTabbar('tabbarAnalytics', 'analytics');

    apShowLoading(wrap);

    try {
        /* STEP 1: Fresh fetch from Supabase */
        var liveUsers    = Array.isArray(window.USERS)    ? window.USERS.slice()    : [];
        var livePayments = Array.isArray(window.PAYMENTS) ? window.PAYMENTS.slice() : [];

        if (typeof supabaseFetchAllProfilesForAdmin === 'function') {
            try {
                var fp = await supabaseFetchAllProfilesForAdmin();
                if (Array.isArray(fp)) { liveUsers = fp; window.USERS = fp; }
            } catch(e) { console.warn('[Analytics] Profiles fetch:', e); }
        }

        if (typeof supabaseFetchPaymentsForAdmin === 'function') {
            try {
                var fpy = await supabaseFetchPaymentsForAdmin();
                if (Array.isArray(fpy)) { livePayments = fpy; window.PAYMENTS = fpy; }
            } catch(e) { console.warn('[Analytics] Payments fetch:', e); }
        }

        /* STEP 2: Timeframe filters */
        var regTf   = analyticsPageState.regTimeframe;
        var revTf   = analyticsPageState.revTimeframe;
        var rStart  = apGetStartDate(regTf);
        var pyStart = apGetStartDate(revTf);
        var endDay  = new Date(); endDay.setHours(23,59,59,999);

        var _isBoy  = function(g){ return typeof isBoyGender  ==='function'?isBoyGender(g) :(g==='Boy' ||g==='boys'); };
        var _isGirl = function(g){ return typeof isGirlGender ==='function'?isGirlGender(g):(g==='Girl'||g==='girls'); };

        var regUsers = liveUsers.filter(function(u){
            var d=apParseDate(u.createdAt||u.created_at||u.regDate||u.registeredAt||u.joinedAt||u.registered||'');
            return d && d>=rStart && d<=endDay;
        }).sort(function(a,b){
            var da=apParseDate(a.createdAt||a.created_at||a.regDate||a.registered||'');
            var db=apParseDate(b.createdAt||b.created_at||b.regDate||b.registered||'');
            return (db?db.getTime():0)-(da?da.getTime():0);
        });

        var revPay = livePayments.filter(function(p){
            var d=apParseDate(p.createdAt||p.created_at||p.date||'');
            return d && d>=pyStart && d<=endDay && (p.status==='success'||p.status==='paid');
        }).sort(function(a,b){
            var da=apParseDate(a.createdAt||a.created_at||a.date||'');
            var db=apParseDate(b.createdAt||b.created_at||b.date||'');
            return (db?db.getTime():0)-(da?da.getTime():0);
        });

        var totalRev     = revPay.reduce(function(s,p){return s+(Number(p.amount)||0);},0);
        var regBoys      = regUsers.filter(function(u){return _isBoy(u.gender);}).length;
        var regGirls     = regUsers.filter(function(u){return _isGirl(u.gender);}).length;
        var totAll       = liveUsers.length;
        var totBoysAll   = liveUsers.filter(function(u){return _isBoy(u.gender);}).length;
        var totGirlsAll  = liveUsers.filter(function(u){return _isGirl(u.gender);}).length;
        var totPaidAll   = liveUsers.filter(function(u){return u.paymentStatus==='paid'||u.paymentStatus==='Paid'||u.payment_status==='paid';}).length;
        var totRevAll    = livePayments.filter(function(p){return p.status==='success'||p.status==='paid';}).reduce(function(s,p){return s+(Number(p.amount)||0);},0);

        /* STEP 3: Community breakdown */
        var cmap={};
        liveUsers.forEach(function(u){
            var c=u.community||u.caste||'Unknown';
            if(!cmap[c])cmap[c]={boys:0,girls:0};
            if(_isBoy(u.gender))cmap[c].boys++;else cmap[c].girls++;
        });
        var carr=Object.keys(cmap).map(function(k){
            return{name:k,boys:cmap[k].boys,girls:cmap[k].girls,total:cmap[k].boys+cmap[k].girls};
        }).sort(function(a,b){return b.total-a.total;});

        /* STEP 4: Registration rows */
        var rr='';
        if (!regUsers.length) {
            rr='<tr><td colspan="7" class="ap-empty-td"><i class="fa-solid fa-users-slash"></i> '+apTfLabel(regTf)+' ma koi navi registration nathi</td></tr>';
        } else {
            regUsers.forEach(function(u,i){
                var d=apParseDate(u.createdAt||u.created_at||u.regDate||u.registered||'');
                var girl=_isGirl(u.gender), boy=_isBoy(u.gender);
                var gb=girl?'<span class="ap-badge ap-badge-girl"><i class="fa-solid fa-venus"></i> Girl</span>':boy?'<span class="ap-badge ap-badge-boy"><i class="fa-solid fa-mars"></i> Boy</span>':'<span class="ap-badge">'+apEsc(u.gender||'')+'</span>';
                var pb=girl?'<span class="ap-badge ap-badge-free"><i class="fa-solid fa-heart"></i> Free</span>':(u.paymentStatus==='paid'||u.paymentStatus==='Paid'||u.payment_status==='paid')?'<span class="ap-badge ap-badge-paid"><i class="fa-solid fa-crown"></i> Paid</span>':'<span class="ap-badge ap-badge-unpaid">Unpaid</span>';
                var st=u.accountStatus||u.account_status||u.status||'active';
                var sb=(st==='suspended'||st==='Suspended')?'<span class="ap-badge ap-badge-suspended"><i class="fa-solid fa-ban"></i> Suspended</span>':'<span class="ap-badge ap-badge-active"><i class="fa-solid fa-check"></i> Active</span>';
                var nm=u.name||u.fullName||'', uid=u.id||u.userId||'';
                rr+='<tr><td class="ap-td-num">'+(i+1)+'</td>';
                rr+='<td class="ap-td-name"><div class="ap-member-cell"><div class="ap-avatar">'+(nm?nm.charAt(0).toUpperCase():'?')+'</div><div><div class="ap-member-name">'+apEsc(nm||'Unknown')+'</div><div class="ap-member-sub">'+apEsc(u.email||u.mobile||'')+'</div></div></div></td>';
                rr+='<td>'+gb+'</td>';
                rr+='<td class="ap-td-city">'+apEsc(u.village||u.city||'')+'</td>';
                rr+='<td class="ap-td-community">'+apEsc(u.community||u.caste||'')+'</td>';
                rr+='<td><span class="ap-date-cell">'+(d?apFmtDate(d):'&mdash;')+'</span></td>';
                rr+='<td class="ap-td-badges">'+pb+' '+sb+(uid?' <button class="ap-eye-btn" onclick="apViewUser(\''+uid+'\')" title="View Profile"><i class="fa-solid fa-eye"></i></button>':'')+'</td></tr>';
            });
        }

        /* STEP 5: Revenue rows */
        var rv='';
        if (!revPay.length) {
            rv='<tr><td colspan="7" class="ap-empty-td"><i class="fa-solid fa-receipt"></i> '+apTfLabel(revTf)+' ma koi payment nathi</td></tr>';
        } else {
            revPay.forEach(function(p,i){
                var d=apParseDate(p.createdAt||p.created_at||p.date||'');
                var unm=p.user_name||p.userName||'', uid=p.user_id||p.userId||'';
                var txn=p.id||p.razorpay_payment_id||'';
                var stx=String(txn).slice(0,18)+(String(txn).length>18?'&hellip;':'');
                rv+='<tr><td class="ap-td-num">'+(i+1)+'</td>';
                rv+='<td class="ap-td-name"><div class="ap-member-cell"><div class="ap-avatar ap-avatar-green">'+(unm?unm.charAt(0).toUpperCase():'?')+'</div><div><div class="ap-member-name">'+apEsc(unm||'Member')+'</div><div class="ap-member-sub">'+apEsc(String(uid).slice(0,20))+'</div></div></div></td>';
                rv+='<td><span class="ap-amount-cell">&#8377;'+(Number(p.amount)||49)+'</span></td>';
                rv+='<td class="ap-td-plan">'+apEsc(p.plan||'Boys 30 Days Pass')+'</td>';
                rv+='<td><span class="ap-badge ap-badge-method"><i class="fa-solid fa-bolt"></i> '+apEsc(p.method||'UPI')+'</span></td>';
                rv+='<td><span class="ap-date-cell">'+(d?apFmtDate(d):(p.date||'&mdash;'))+'</span></td>';
                rv+='<td><div class="ap-txn-id">'+stx+'</div>'+(uid?'<button class="ap-eye-btn" onclick="apViewUser(\''+uid+'\')" title="View Profile"><i class="fa-solid fa-eye"></i></button>':'')+'</td></tr>';
            });
        }

        /* STEP 6: Community rows */
        var cr='';
        if (!carr.length) {
            cr='<tr><td colspan="5" class="ap-empty-td"><i class="fa-solid fa-layer-group"></i> No community data available</td></tr>';
        } else {
            carr.slice(0,60).forEach(function(c,i){
                var pct=totAll>0?Math.round(c.total/totAll*100):0;
                cr+='<tr><td class="ap-td-num">'+(i+1)+'</td>';
                cr+='<td><div class="ap-member-name" style="font-size:12.5px;">'+apEsc(c.name)+'</div></td>';
                cr+='<td><span class="ap-badge ap-badge-boy"><i class="fa-solid fa-mars"></i> '+c.boys+'</span></td>';
                cr+='<td><span class="ap-badge ap-badge-girl"><i class="fa-solid fa-venus"></i> '+c.girls+'</span></td>';
                cr+='<td><div style="display:flex;align-items:center;gap:8px;"><div class="ap-comm-bar-wrap"><div class="ap-comm-bar" style="width:'+pct+'%;"></div></div><span style="font-size:11px;font-weight:700;min-width:28px;">'+c.total+'</span></div></td></tr>';
            });
        }

        /* STEP 7: Assemble final HTML */
        var now = new Date().toLocaleTimeString('en-IN');
        var H = '';

        /* Overall KPI Cards */
        H += '<div class="ap-overall-stats">';
        H += apOCard('#EBF3FF','#2563EB','fa-users',totAll,'Total Members');
        H += apOCard('#EBF3FF','#2563EB','fa-mars',totBoysAll,'Total Boys');
        H += apOCard('#FFF0F6','#DB2777','fa-venus',totGirlsAll,'Total Girls');
        H += '<div class="ap-overall-card"><div class="ap-overall-icon" style="background:#ECFDF5;color:#059669;"><i class="fa-solid fa-indian-rupee-sign"></i></div><div class="ap-overall-val" style="color:#059669;">&#8377;'+totRevAll+'</div><div class="ap-overall-lbl">Total Revenue</div></div>';
        H += apOCard('#FEF9EC','#B45309','fa-crown',totPaidAll,'Paid Members');
        H += apOCard('#F3F0FF','#7C3AED','fa-layer-group',carr.length,'Communities');
        H += '</div>';

        H += '<div class="ap-live-badge"><span class="ap-live-dot"></span> Live Supabase DB &middot; '+now+' na update</div>';

        /* Table 1: Registrations */
        H += '<div class="ap-section">';
        H += '<div class="ap-section-header"><div class="ap-section-icon" style="background:#F0E4FA;color:#7B2CBF;"><i class="fa-solid fa-user-plus"></i></div><div><div class="ap-section-title">Member Registrations</div><div class="ap-section-sub">Selected period ma nava join thayal members</div></div><div class="ap-section-badge">'+regUsers.length+'</div></div>';
        H += '<div class="ap-summary-strip">';
        H += '<div class="ap-summary-card" style="border-left:3px solid #7B2CBF;"><div class="ap-summary-val">'+regUsers.length+'</div><div class="ap-summary-lbl">Total Joined</div></div>';
        H += '<div class="ap-summary-card" style="border-left:3px solid #2563EB;"><div class="ap-summary-val">'+regBoys+'</div><div class="ap-summary-lbl">Boys</div></div>';
        H += '<div class="ap-summary-card" style="border-left:3px solid #DB2777;"><div class="ap-summary-val">'+regGirls+'</div><div class="ap-summary-lbl">Girls</div></div>';
        H += '<div class="ap-summary-card" style="border-left:3px solid #2E9D62;"><div class="ap-summary-val" style="color:#2E9D62;font-size:13px;">'+apTfLabel(regTf)+'</div><div class="ap-summary-lbl">Period</div></div>';
        H += '</div>';
        H += '<div class="ap-pills-row">'+apPillsHtml(regTf,'apSetRegTf')+'</div>';
        H += '<div class="ap-table-wrap"><table class="ap-table"><thead><tr><th>#</th><th>Member Name</th><th>Gender</th><th>City / Village</th><th>Community</th><th>Joined Date &amp; Time</th><th>Status &amp; Actions</th></tr></thead><tbody>'+rr+'</tbody></table></div>';
        if (regUsers.length) H += '<div class="ap-table-footer"><i class="fa-solid fa-database"></i> Live Supabase DB &middot; <b>'+regUsers.length+'</b> registrations for <b>'+apTfLabel(regTf)+'</b></div>';
        H += '</div>';

        /* Table 2: Revenue */
        H += '<div class="ap-section" style="margin-top:20px;">';
        H += '<div class="ap-section-header"><div class="ap-section-icon" style="background:#ECFDF5;color:#059669;"><i class="fa-solid fa-indian-rupee-sign"></i></div><div><div class="ap-section-title" style="color:#065F46;">Revenue &amp; Collections</div><div class="ap-section-sub">Boys &#8377;49 pass payments received</div></div><div class="ap-section-badge" style="background:#ECFDF5;color:#059669;">&#8377;'+totalRev+'</div></div>';
        H += '<div class="ap-summary-strip">';
        H += '<div class="ap-summary-card" style="border-left:3px solid #10B981;background:linear-gradient(135deg,#ECFDF5,#F0FDF4);"><div class="ap-summary-val" style="color:#059669;font-size:20px;">&#8377;'+totalRev+'</div><div class="ap-summary-lbl">Total Earned</div></div>';
        H += '<div class="ap-summary-card" style="border-left:3px solid #3B82F6;"><div class="ap-summary-val">'+revPay.length+'</div><div class="ap-summary-lbl">Passes Sold</div></div>';
        H += '<div class="ap-summary-card" style="border-left:3px solid #F59E0B;"><div class="ap-summary-val">&#8377;49</div><div class="ap-summary-lbl">Per Pass</div></div>';
        H += '<div class="ap-summary-card" style="border-left:3px solid #8B5CF6;"><div class="ap-summary-val" style="color:#7C3AED;font-size:13px;">'+apTfLabel(revTf)+'</div><div class="ap-summary-lbl">Period</div></div>';
        H += '</div>';
        H += '<div class="ap-pills-row">'+apPillsHtml(revTf,'apSetRevTf')+'</div>';
        H += '<div class="ap-table-wrap"><table class="ap-table"><thead><tr><th>#</th><th>Member Name</th><th>Amount</th><th>Plan</th><th>Method</th><th>Payment Date &amp; Time</th><th>Transaction ID</th></tr></thead><tbody>'+rv+'</tbody></table></div>';
        if (revPay.length) H += '<div class="ap-table-footer"><i class="fa-solid fa-circle-check" style="color:#10B981;"></i> <b>'+revPay.length+'</b> successful payments &middot; Total: <b style="color:#059669;">&#8377;'+totalRev+'</b> &middot; '+apTfLabel(revTf)+'</div>';
        H += '</div>';

        /* Table 3: Community Breakdown */
        H += '<div class="ap-section" style="margin-top:20px;">';
        H += '<div class="ap-section-header"><div class="ap-section-icon" style="background:#F3F0FF;color:#7C3AED;"><i class="fa-solid fa-layer-group"></i></div><div><div class="ap-section-title" style="color:#4C1D95;">Community-wise Members</div><div class="ap-section-sub">All-time member breakdown by community / caste</div></div><div class="ap-section-badge" style="background:#F3F0FF;color:#7C3AED;">'+carr.length+'</div></div>';
        H += '<div class="ap-table-wrap"><table class="ap-table"><thead><tr><th>#</th><th>Community / Caste</th><th>Boys</th><th>Girls</th><th>Total &amp; Share</th></tr></thead><tbody>'+cr+'</tbody></table></div>';
        if (carr.length) H += '<div class="ap-table-footer"><i class="fa-solid fa-layer-group"></i> <b>'+carr.length+'</b> different communities &middot; <b>'+totAll+'</b> total members</div>';
        H += '</div>';

        wrap.innerHTML = H;
        if (isManualRefresh && typeof showToast === 'function') {
            showToast('Analytics live synced with Supabase');
        }

    } catch(err) {
        var w2 = document.getElementById('analyticsPageContent');
        if (w2) {
            w2.innerHTML = '<div class="ap-error-state"><div class="ap-error-icon"><i class="fa-solid fa-triangle-exclamation"></i></div><div class="ap-error-title">Database Connection Error</div><div class="ap-error-msg">'+String(err&&err.message?err.message:err)+'</div><button class="btn btn-primary" style="margin-top:16px;" onclick="renderAnalyticsPage()"><i class="fa-solid fa-rotate-right"></i> Retry</button></div>';
        }
        console.error('[Analytics] Render error:', err);
    }
}
window.renderAnalyticsPage = renderAnalyticsPage;

/* Helper to build overall stat card */
function apOCard(bg, color, icon, val, lbl) {
    return '<div class="ap-overall-card"><div class="ap-overall-icon" style="background:'+bg+';color:'+color+';"><i class="fa-solid '+icon+'"></i></div><div class="ap-overall-val">'+val+'</div><div class="ap-overall-lbl">'+lbl+'</div></div>';
}

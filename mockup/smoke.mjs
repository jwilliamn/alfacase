import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
import {writeFileSync} from 'node:fs';
const require=createRequire(process.env.MOCKUP_TEST_PACKAGE || new URL('./package.json',import.meta.url));
const {default:puppeteer}=await import(require.resolve('puppeteer-core'));
const base=new URL(process.env.MOCKUP_URL || 'http://127.0.0.1:8080/');
const browser=await puppeteer.launch({executablePath:process.env.CHROMIUM_PATH || '/usr/bin/chromium',headless:true,args:['--no-sandbox']});
const passed=[];
const test=async(name,fn)=>{await fn();passed.push(name);console.log(`PASS ${name}`);};
try {
  const page=await browser.newPage();
  const errors=[],requests=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('request',r=>requests.push(r.url()));
  await page.setViewport({width:1440,height:1000,deviceScaleFactor:1});
  await page.goto(base.href,{waitUntil:'networkidle0'});
  const click=s=>page.click(s);
  const value=async(selector)=>page.$eval(selector,n=>Number(n.dataset.value));
  const choice=()=>page.$eval('[data-testid="preferred-option"]',n=>n.dataset.choice);
  const set=async(id,value)=>page.$eval(`#${id}`,(n,v)=>{n.value=String(v);n.dispatchEvent(new Event('input',{bubbles:true}));},value);
  await test('Initial view and explicit synthetic-data label',async()=>{
    assert.equal(await page.$$eval('.news-card',n=>n.length),5);
    assert.match(await page.$eval('.demo-pill',n=>n.textContent),/СИНТЕТИЧЕСКИЕ/);
    assert.match(await page.$eval('.detail-title',n=>n.textContent),/Ставка/);
  });
  await test('Intelligence and Business Impact layers',async()=>{
    await click('[data-action="layer"][data-layer="1"]');
    assert.ok(await page.$('.search-map'));
    await click('[data-action="layer"][data-layer="2"]');
    assert.equal(await page.$$eval('.impact-box',n=>n.length),2);
  });
  await test('Company and role switches change ranking and context',async()=>{
    await page.select('#company','vector');
    assert.match(await page.$eval('.news-card:first-child h3',n=>n.textContent),/размещения/);
    await click('.news-card[data-id="rates"]');
    assert.match(await page.$eval('.impact-copy',n=>n.textContent),/кредитная нагрузка неизвестна/);
    await page.select('#company','north');
    const before=await page.$eval('.news-card[data-id="rates"] .score',n=>n.textContent);
    await page.select('#role','treasury');
    const after=await page.$eval('.news-card[data-id="rates"] .score',n=>n.textContent);
    assert.notEqual(before,after);
    assert.match(await page.$eval('.detail-meta',n=>n.textContent),/Казначейство/);
    await page.select('#role','cfo');
  });
  await test('Feed filtering and source provenance',async()=>{
    await click('[data-filter="supply"]');
    assert.equal(await page.$$eval('.news-card',n=>n.length),2);
    await click('[data-filter="all"]');
    await click('.news-card[data-id="rates"]');
    await click('.detail-actions [data-action="sources"]');
    assert.equal(await page.$$eval('.evidence-card',n=>n.length),3);
    assert.match(await page.$eval('.drawer',n=>n.textContent),/Не отражает действительную позицию банка/);
  });
  await test('Drawer focus trap, Escape, and focus restoration',async()=>{
    assert.equal(await page.evaluate(()=>document.activeElement.className),'close-button');
    await page.keyboard.down('Shift');await page.keyboard.press('Tab');await page.keyboard.up('Shift');
    assert.equal(await page.evaluate(()=>document.activeElement.dataset.tab),'agent');
    await page.keyboard.press('Tab');
    assert.equal(await page.evaluate(()=>document.activeElement.className),'close-button');
    await page.keyboard.press('Escape');
    assert.equal(await page.$('.drawer'),null);
    assert.equal(await page.evaluate(()=>document.activeElement.dataset.action),'sources');
  });
  await test('Agent diagram and simulated missing-evidence branch',async()=>{
    await click('.detail-actions [data-action="agent"]');
    assert.ok(await page.$('[data-testid="agent-diagram"]'));
    assert.match(await page.$eval('.drawer-notice',n=>n.textContent),/без вызовов LLM/);
    await click('[data-testid="retry-demo"]');
    assert.match(await page.$eval('[data-testid="retry-result"]',n=>n.textContent),/новый запрос/);
    await click('.drawer .btn-dark[data-action="refresh"]');
    await page.waitForFunction(()=>document.querySelector('.drawer .btn-dark')?.textContent.includes('Воспроизвести'));
    assert.equal(await page.$$eval('.step-marker.pending',n=>n.length),0);
    await page.keyboard.press('Escape');
  });
  await test('Follow-up keeps context and escapes input',async()=>{
    const question='<img src=x onerror="window.injected=true"> Какие данные нужны?';
    await page.type('#question',question);
    await click('#question-form button');
    assert.match(await page.$eval('.answer:last-child',n=>n.textContent),/Северная мануфактура/);
    assert.equal(await page.$('.answer img'),null);
    assert.equal(await page.evaluate(()=>window.injected),undefined);
  });
  await test('Feedback is scoped to company and role',async()=>{
    await click('[data-action="feedback"][data-value="yes"]');
    assert.equal(await page.$eval('[data-value="yes"]',n=>n.getAttribute('aria-pressed')),'true');
    await page.select('#company','vector');
    assert.equal(await page.$eval('[data-value="yes"]',n=>n.getAttribute('aria-pressed')),'false');
    await page.select('#company','north');
  });
  await test('Scenario costs and break-even match independent expected values',async()=>{
    await click('[data-action="decision"]');
    assert.equal(await choice(),'fixed');
    for(const [i,rate] of [.14,.16,.18].entries())assert.ok(Math.abs(await value(`[data-testid="floating-${i}"]`)-100000000*rate*90/365)<.00001);
    assert.ok(Math.abs(await value('[data-testid="fixed-0"]')-3971917.808219178)<.00001);
    assert.ok(Math.abs(await value('#breakeven-value')-16.108333333333334)<.000001);
  });
  await test('Objective and liquidity constraint change preferred option',async()=>{
    await page.select('#objective','unchanged');assert.equal(await choice(),'floating');
    await page.select('#objective','worst');assert.equal(await choice(),'fixed');
    await set('maxFee',0);assert.equal(await choice(),'floating');
    assert.match(await page.$eval('.recommendation',n=>n.textContent),/превышает ваш лимит/);
  });
  await test('Input edits recalculate and remain scoped to company',async()=>{
    await click('[data-action="reset-inputs"]');
    await set('principal',250);
    assert.ok(Math.abs(await value('[data-testid="floating-1"]')-250000000*.16*90/365)<.00001);
    await page.select('#company','vector');assert.equal(await page.$eval('#principal',n=>n.value),'100');
    await set('principal',200);
    await page.select('#company','north');assert.equal(await page.$eval('#principal',n=>n.value),'250');
  });
  await test('Missing, zero and impossible parameters show errors',async()=>{
    await set('principal','');assert.ok(await page.$('.comparison-error'));
    assert.equal(await page.$('[data-testid="fixed-0"]'),null);
    await set('principal',0);assert.ok(await page.$('.comparison-error'));
    await set('principal',100);await set('days',0);assert.ok(await page.$('.comparison-error'));
    await set('days',90);await set('shift',20);assert.ok(await page.$('.comparison-error'));
    await set('shift',2);await set('fee',-1);assert.ok(await page.$('.comparison-error'));
  });
  await test('Zero rates and equal-cost case remain valid',async()=>{
    await click('[data-action="reset-inputs"]');
    for(const id of ['shift','base','fixed','fee'])await set(id,0);
    assert.equal(await choice(),'tie');assert.equal(await value('[data-testid="fixed-0"]'),0);
    assert.equal(await value('#breakeven-value'),0);
    await click('[data-action="reset-inputs"]');
  });
  await test('Home entry and source-library navigation',async()=>{
    await click('.nav-item[data-view="home"]');assert.ok(await page.$('.home-tile'));
    await click('.home-tile button');assert.ok(await page.$('.news-list'));
    await click('.nav-item[data-view="sources"]');assert.equal(await page.$$eval('.source-overview',n=>n.length),2);
  });
  await test('New text enters feed without executing markup',async()=>{
    await click('.decision-heading [data-action="import"]');
    await page.type('#import-title','<img src=x onerror="window.injected=true"> Новая ставка');
    await page.type('#import-text','Тестовая публикация о кредитной ставке. Это пользовательский ввод для проверки интерфейса.');
    await click('#import-form button[type="submit"]');
    assert.equal(await page.$$eval('.news-card',n=>n.length),6);
    assert.match(await page.$eval('.detail-title',n=>n.textContent),/<img/);
    assert.equal(await page.$('.detail-card img'),null);
    assert.equal(await page.evaluate(()=>window.injected),undefined);
    assert.equal(await page.$eval('.nav-badge',n=>n.textContent),'6');
    await click('.detail-actions [data-action="sources"]');
    assert.equal(await page.$$eval('.evidence-card',n=>n.length),2);
    await page.keyboard.press('Escape');
  });
  await test('Responsive layouts have no horizontal page overflow',async()=>{
    await page.reload({waitUntil:'networkidle0'});
    for(const width of [1440,1024,768,390,320]){
      await page.setViewport({width,height:900,deviceScaleFactor:1});
      for(const view of ['home','insights','sources','decision']){
        await click(`.nav-item[data-view="${view}"]`);
        const size=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,width:innerWidth}));
        assert.ok(size.scroll<=size.width,`${view} at ${width}px overflows: ${JSON.stringify(size)}`);
      }
    }
  });
  await test('Standalone export works without app asset requests',async()=>{
    const standalone=await browser.newPage();const external=[];
    standalone.on('request',r=>{if(!r.url().endsWith('/standalone.html')&&!r.url().startsWith('data:'))external.push(r.url());});
    await standalone.goto(new URL('standalone.html',base).href,{waitUntil:'networkidle0'});
    assert.equal(await standalone.$$eval('.news-card',n=>n.length),5);
    await standalone.click('[data-action="decision"]');
    assert.equal(await standalone.$eval('[data-testid="preferred-option"]',n=>n.dataset.choice),'fixed');
    assert.deepEqual(external,[]);
    await standalone.close();
  });
  await test('No uncaught browser errors or external service calls',async()=>{
    assert.deepEqual(errors,[]);
    assert.deepEqual(requests.filter(u=>!u.startsWith(base.origin+'/')&&!u.startsWith('data:')),[]);
  });
  if(process.env.MOCKUP_REPORT_PATH)writeFileSync(process.env.MOCKUP_REPORT_PATH,JSON.stringify({passed,failed:0},null,2));
  console.log(`Completed ${passed.length} checks.`);
} finally {await browser.close();}

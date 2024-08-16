$(function() {
  setTimeout(() => {
    startContent();
  }, 1000)
})

var lastLink = '';
function startContent() {
  const xlsxScript = document.createElement('script');
  xlsxScript.src = chrome.runtime.getURL('libs/xlsx.full.min.js');
  document.head.appendChild(xlsxScript);

  const jsPDFScript = document.createElement('script');
  jsPDFScript.src = chrome.runtime.getURL('libs/jsPDF.min.js');
  document.head.appendChild(jsPDFScript);


  href = location.href;
  if (href.indexOf('https://www.google.com/maps/') > -1) {
    startTrigger();
    createOverlay();
  }
}

function startTrigger() {
  if ($('.aIFcqe').find(`[role='feed']`).length > 0) {
    urlChangeEvent();
  } else {
    setTimeout(() => {
      startTrigger();
    }, 1000);
  }
}
function urlChangeEvent() {
  addCheckmark();
  var $basketAmount = $('#QA0Szd div[jstcache="3"]');
  var observer = new MutationObserver(function(e) {addCheckmark();});
  observer.observe($($basketAmount)[0], {characterData: true, childList: true, subtree: true});
}

function createOverlay() {
  const overlay = document.createElement('div');
  overlay.id = 'gmb-scraper-overlay';
  overlay.innerHTML = `
    <h3>GMB Data</h3>
    <button id="scrape-data-btn" style="display:none;">Scrape Data</button>
    <button id="download-csv-btn">Download CSV</button>
    <button id="download-excel-btn">Download Excel</button>
    <button id="download-pdf-btn">Download PDF</button>
    <a href="https://buy.stripe.com/bIYbMO5Hz8fz8MwdQQ" target="_blank">Subscribe</a>
  `;
    // <button id="download-google-sheets-btn">Download Google Sheets</button>
  document.body.appendChild(overlay);

  document.getElementById('scrape-data-btn').addEventListener('click', scrapeData);
  document.getElementById('download-csv-btn').addEventListener('click', () => downloadData('csv'));
  document.getElementById('download-excel-btn').addEventListener('click', () => downloadData('excel'));
  document.getElementById('download-pdf-btn').addEventListener('click', () => downloadData('pdf'));
  // document.getElementById('download-google-sheets-btn').addEventListener('click', () => downloadData('google_sheets'));

  $('#QA0Szd div[jstcache="3"]').append(`
    <div class='top_label'>
      <div>name</div>
      <div>phone</div>
      <div>email</div>
      <div>website</div>
      <div>category</div>
      <div>reviews</div>
      <div>rating</div>
      <div>G Analytics</div>
      <div>FB Pixel</div>
      <div>G Tag</div>
      <div>G Ads</div>
    </div>
  `)
  $('body').append(`<div class='gmb_loading'><div></div></div>`);

  idx = 0;

}

function addCheckmark() {
  sr = $('.aIFcqe').find(`[role='feed']`);
  sr = sr.find('a.hfpxzc');
  sr.each(function() {
    obj = $(this).parent();
    if (obj.find('.gb_chk').length < 1) {
      obj.append(`
        <div class='gb_chk'>
          <input type='checkbox' checked/>
        </div>
      `);
    }
  })
}

let scrapedData = [];
let idx = 0;

async function scrapeData() {
  $('.gmb_loading').css('display', 'flex');
  let promise = new Promise(function (resolve, reject) {
    sr = $('#pane').next().find('.m6QErb.WNBkOb.XiKgde');
    sr = $('#pane').next().find(`[role='main']`);
    sr = $('.aIFcqe').find(`[role='feed']`);
    sr = sr.find('a.hfpxzc');

    scrapedData = [];
    idx = 0;
    sr.each(async function() {
      obj = $(this).parent();
      obj.attr('id', 'gmb_'+idx);
      if (obj.find('.gb_chk input').prop('checked')) {
        url = $(this).attr('href');
        scrapedData.push(
          {
            url: url.split('/data=')[0],
            name: obj.find('.qBF1Pd').text(),
            reviews: obj.find('.UY7F9').text().replace('(','').replace(')',''),
            rating: obj.find('.MW4etd').text(),
            category: obj.find('.W4Efsd .W4Efsd span:first-child span').text().split(' ⋅')[0],
            phone: '',
            website: ''
          }
        );
        // "([a-zA-Z0-9-]+\.([a-zA-Z])+)"
        $.get(url, async function(res) {
          t = res.split('tel:');
          t = t.length>1 ? t[1].split('\\')[0] : '';
          str = res.replace(/\\/g,"").split('window.APP_INITIALIZATION_STATE=');
          str = str[1].split('window.APP_FLAGS=')[0];
          regex = /\[\[\[3,null,\[\[\[\".*?(.com|.co.uk|.fr|.net)\"]/gm;
          regex = /\,"([a-z0-9][a-z0-9\-]{0,61}[a-z0-9]\.)+[a-z0-9][a-z0-9\-]*[a-z0-9]\"/gm;
          found = str.match(regex)
          website = found ? found[0].replace('"','').replace('"','').replace(',','') : '';
          for (i=0; i<scrapedData.length; i++) {
            if (res.indexOf(scrapedData[i].url) > -1) {
              scrapedData[i].phone = t;
              scrapedData[i].website = website;
              const analyticsData = {googleAnalytics:'false', facebookPixel:'false', googleTag:'false', googleAds:'true'};//await fetchAnalyticsData(website);
              scrapedData[i].googleAnalytics = analyticsData.googleAnalytics;
              scrapedData[i].facebookPixel = analyticsData.facebookPixel;
              scrapedData[i].googleTag = analyticsData.googleTag;
              scrapedData[i].googleAds = analyticsData.googleAds;
            }
          }
          idx++;
          if (idx == sr.length) {
            $('.gmb_loading').hide();
            for (i=0; i<scrapedData.length; i++) {
              delete scrapedData[i].url;
            }
            console.log(scrapedData)
            resolve(scrapedData);
          }
        })
      }
    })
  })
  return promise;
}

function fetchAnalyticsData(url) {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ action: 'fetch_analytics_data', url }, resolve);
  });
}

function downloadData(type) {
  scrapeData().then((data) => {
    if (type === 'csv') {
      downloadCSV(scrapedData);
    } else if (type === 'excel') {
      downloadExcel(scrapedData);
    } else if (type === 'pdf') {
      downloadPDF(scrapedData);
    } else if (type === 'google_sheets') {
      downloadGoogleSheets(scrapedData);
    }
  }); 
  return;
}

function downloadCSV(data) {
  const csvContent = "data:text/csv;charset=utf-8," + 
    ['Name', 'Phone', 'Website', 'Email', 'Category', 'Reviews', 'Rating', 'Google Analytics', 'Facebook Pixel', 'Google Tag', 'Google Ads']
    .join(',') + '\n' +
    data.map(e => [
      e.name, e.phone, e.website, e.email, e.category, e.reviews, e.rating,
      e.googleAnalytics, e.facebookPixel, e.googleTag, e.googleAds
    ].join(',')).join('\n');

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", "gmb_data.csv");
  document.body.appendChild(link);
  link.click();
}

function downloadExcel(data) {
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'GMB Data');

  XLSX.writeFile(wb, 'gmb_data.xlsx');
}

function downloadPDF(data) {
  // window.jsPDF = window.jspdf.jsPDF;
  const doc = new jsPDF();
  const columns = ['Name', 'Phone', 'Website', 'Email', 'Category', 'Reviews', 'Rating'];
  const rows = data.map(e => [
    e.name, e.phone, e.website, e.email, e.category.split(' ')[0], e.reviews, e.rating,
    // e.googleAnalytics, e.facebookPixel, e.googleTag, e.googleAds
  ]);

  // source = '';
  // source = `<table id="tbl" class="table table-hover" style="width:100%">
  //   <thead>
  //       <tr>
  //         <th style="background-color: #928989; color; white;">Name</th>
  //         <th style="background-color: #928989; color; white;">Phone</th>
  //         <th style="background-color: #928989; color; white;">Website</th>
  //         <th style="background-color: #928989; color; white;">Email</th>
  //         <th style="background-color: #928989; color; white;">Category</th>
  //         <th style="background-color: #928989; color; white;">Reviews</th>
  //         <th style="background-color: #928989; color; white;">Rating</th>
  //       </tr>
  //     </thead><tbody>
  // `;
  // data.forEach((e) => {
  //   source += `<tr>
  //       <td>`+e.name+`</td>
  //       <td>`+e.phone+`</td>
  //       <td>`+e.website+`</td>
  //       <td>`+(e.email?e.email:'')+`</td>
  //       <td>`+e.category+`</td>
  //       <td>`+e.reviews+`</td>
  //       <td>`+e.rating+`</td>
  //   </tr>`;
  // })
  // source += `<tbody></table>`;

  // margins = {
  //     top: 80,
  //     bottom: 60,
  //     left: 10,
  //     width: 700
  // };
  // specialElementHandlers = {
  //     // element with id of "bypass" - jQuery style selector
  //     '#bypassme': function (element, renderer) {
  //         // true = "handled elsewhere, bypass text extraction"
  //         return true
  //     }
  // };
  // doc.fromHTML(
  //   source, // HTML string or DOM elem ref.
  //   margins.left, // x coord
  //   margins.top, { // y coord
  //       'width': margins.width, // max width of content on PDF
  //       'elementHandlers': specialElementHandlers
  // }, function (dispose) {
  //     doc.save('gmb_data.pdf');
  // }, margins);

  doc.autoTable(columns, rows);
  doc.save('gmb_data.pdf');
}

function downloadGoogleSheets(data) {
  // Requires Google Sheets API integration
  const params = {
    spreadsheetId: 'your-spreadsheet-id',
    range: 'Sheet1!A1',
    valueInputOption: 'RAW',
    insertDataOption: 'INSERT_ROWS',
    resource: {
      values: [
        ['Name', 'Phone', 'Website', 'Email', 'Category', 'Reviews', 'Rating', 'Google Analytics', 'Facebook Pixel', 'Google Tag', 'Google Ads'],
        ...data.map(e => [
          e.name, e.phone, e.website, e.email, e.category, e.reviews, e.rating,
          e.googleAnalytics, e.facebookPixel, e.googleTag, e.googleAds
        ])
      ]
    }
  };

  gapi.client.sheets.spreadsheets.values.append(params).then(response => {
    console.log(response);
  });
}
import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from 'src/app/service/api.service';
import { MessageService } from 'primeng/api';
import autoTable from 'jspdf-autotable';
import jsPDF from 'jspdf';

@Component({
  selector: 'app-purhase-form',
  templateUrl: './purhase-form.component.html',
  styleUrls: ['./purhase-form.component.css']
})
export class PurhaseFormComponent {

  constructor(private route: ActivatedRoute, private router: Router, private api: ApiService, private messageService: MessageService,) { }

  formData: any = {};
  urlId: any;
  party: any = [];
  totalQty: number = 0;
  totalDisc: number = 0;
  totalNetSalePrice: number = 0;
  netAmount: number = 0;
  totalGST: number = 0;
  netQuantity: number = 0;
  netCostTotal: number = 0;
  netSaleTotal: number = 0;
  netProfitInValue: number = 0;
  purcDtl: any[] = [];
  ngOnInit(): void {
    this.urlId = this.route.snapshot.paramMap.get('id');
    this.getCategory();
    this.getItems();
    this.getParty();
    if (this.urlId)
      this.getPurchaseById(this.urlId);
  }
  getPurchaseById(id: number) {
    this.api.getPurchaseById(id).subscribe(res => {
      var res = JSON.parse(res);
      this.formData.partyId = res.purchase[0].vendorId;
      this.formData.remarks = res.purchase[0].remarks;
      this.formData.invoiceNo = res.purchase[0].invoiceNo;
      this.purcDtl = res.purchaseDetails;
      console.log(this.purcDtl);
      this.resetTotals();
      this.calculateTotals();
    })
  }
  onKey(event: any, user: any) {
    user.barcode = event.target.value;
    if (user.barcode.length > 4) {
      this.api.getItemDetailbyBarCode(user.barcode).subscribe(res => {
        user.ItemName = res[0].itemName;
        user.purchasePrice = res[0].purchasePrice;
        user.salePrice = res[0].salePrice
      })
    }
  }
  barCodeChange(user: any) {


  }
  cancel() {
    this.router.navigate(['purchase-list']);
  }
  purchasePriceChange(purcDtl: any) {
    purcDtl[0].subTotal = parseFloat((purcDtl[0].purchasePrice * purcDtl[0].quantity).toFixed(2));
    purcDtl[0].discountByValue = parseFloat(((purcDtl[0].discountByValue * 100) / purcDtl[0].subTotal).toFixed(2));
    purcDtl[0].discountByPercent = parseFloat(((purcDtl[0].subTotal * purcDtl[0].discountByValue) / 100).toFixed(2));
    purcDtl[0].total = parseFloat((purcDtl[0].quantity * purcDtl[0].purchasePrice).toFixed(2));
    purcDtl[0].netTotal = purcDtl[0].total;
    this.resetTotals();
    this.calculateTotals();
  }
  
  discPerChange(purcDtl: any) {
    purcDtl.discountByValue = parseFloat(((purcDtl.subTotal * purcDtl.discountByPercent) / 100).toFixed(2));
    purcDtl.totalIncDisc = parseFloat((purcDtl.subTotal - purcDtl.discountByValue).toFixed(2));
    this.resetTotals();
    this.calculateTotals();
  }
  
  discvallueChange(purcDtl: any) {
    purcDtl.discountByPercent = parseFloat(((purcDtl.discountByValue * 100) / purcDtl.subTotal).toFixed(2));
    purcDtl.totalIncDisc = parseFloat((purcDtl.subTotal - purcDtl.discountByValue).toFixed(2));
    this.resetTotals();
    this.calculateTotals();
  }
  
  qtyChange(user: any) {
    user.netQuantity = parseFloat((user.quantity + user.bonusQuantity).toFixed(2));
    user.subTotal = parseFloat((user.purchasePrice * user.quantity).toFixed(2));
    user.discountByValue = parseFloat(((user.discountByPercent * 100) / user.subTotal).toFixed(2));
    user.discountByPercent = parseFloat(((user.subTotal * user.discountByValue) / 100).toFixed(2));
    user.totalIncDisc = parseFloat((user.subTotal - user.discountByValue).toFixed(2));
    user.netRate = parseFloat((user.totalIncDisc / user.netQuantity).toFixed(2));
    this.resetTotals();
    this.calculateTotals();
  }
  
  bonusQtyChange(user: any) {
    user.netQuantity = parseFloat((user.quantity + user.bonusQuantity).toFixed(2));
    user.subTotal = parseFloat((user.purchasePrice * user.quantity).toFixed(2));
    user.discountByValue = parseFloat(((user.discountByPercent * 100) / user.subTotal).toFixed(2));
    user.discountByPercent = parseFloat(((user.subTotal * user.discountByValue) / 100).toFixed(2));
    user.totalIncDisc = parseFloat((user.subTotal - user.discountByValue).toFixed(2));
    user.netRate = parseFloat((user.totalIncDisc / user.netQuantity).toFixed(2));
    this.resetTotals();
    this.calculateTotals();
  }
  
  discountChange(user: any) {
    user.netQuantity = parseFloat((user.quantity + user.bonusQuantity).toFixed(2));
    user.subTotal = parseFloat((user.purchasePrice * user.quantity).toFixed(2));
    user.discountByValue = parseFloat(((user.discountByPercent / 100) * user.purchasePrice).toFixed(2));
    user.discountByPercent = parseFloat(((user.subTotal * user.discountByValue) / 100).toFixed(2));
    user.netRate = parseFloat((user.totalIncDisc / user.netQuantity).toFixed(2));
    this.resetTotals();
    this.calculateTotals();
  }
  
  gstPerChange(user: any) {
    user.gstByValue = parseFloat(((user.gstByPercent * user.subTotal) / 100).toFixed(2));
    user.netRate = parseFloat(((user.subTotal - (user.discountByPercent * user.purchasePrice / 100)) + user.gstByValue).toFixed(2));
    user.totalIncGst = parseFloat((user.totalIncDisc + user.gstByValue).toFixed(2));
    this.resetTotals();
    this.calculateTotals();
  }
  
  gstValueChange(user: any) {
    user.gstByPercent = parseFloat(((user.gstByValue * 100) / user.subTotal).toFixed(2));
    user.gstByValue = parseFloat(((user.gstByPercent / 100) * user.purchasePrice).toFixed(2));
    user.totalIncGst = parseFloat((user.totalIncDisc + user.gstByValue).toFixed(2));
    user.netRate = parseFloat((user.totalIncGst / user.netQuantity).toFixed(2));
    user.marginPercent = parseFloat((user.netSalePrice - user.netRate).toFixed(2));
    this.resetTotals();
    this.calculateTotals();
  }
  
  saleDiscountByValueChange(user: any) {
    user.netRate = parseFloat(((user.subTotal - (user.discountByPercent * user.purchasePrice) / 100) + user.gstByValue).toFixed(2));
    user.discountByValue = parseFloat(((user.discountByPercent / 100) * user.purchasePrice).toFixed(2));
    user.netSalePrice = parseFloat((user.salePrice - user.saleDiscountByValue).toFixed(2));
    this.resetTotals();
    this.calculateTotals();
  }
  
  netSalePriceChange(user: any) {
    user.marginPercent = parseFloat((user.netSalePrice - user.netRate).toFixed(2));
    this.resetTotals();
    this.calculateTotals();
  }
  
  resetTotals() {
    this.netQuantity = 0;
    this.totalDisc = 0;
    this.totalGST = 0;
    this.netCostTotal = 0;
    this.netSaleTotal = 0;
    this.netProfitInValue = 0;
  }

  calculateTotals() {
    this.purcDtl.forEach(x => {
      if (typeof x.netQuantity === 'number' && !isNaN(x.netQuantity)) {
        this.netQuantity += x.netQuantity;
      }
      if (typeof x.discountByValue === 'number' && !isNaN(x.discountByValue)) {
        this.totalDisc += x.discountByValue;
      }
      if (typeof x.gstByValue === 'number' && !isNaN(x.gstByValue)) {
        this.totalGST += x.gstByValue;
      }
      if (typeof x.netRate === 'number' && !isNaN(x.netRate)) {
        this.netCostTotal += x.netRate;
        if (typeof x.netSalePrice === 'number' && !isNaN(x.netSalePrice)) {
          this.netSaleTotal += x.netSalePrice;
        }
        if (typeof x.marginPercent === 'number' && !isNaN(x.marginPercent)) {
          this.netProfitInValue += x.marginPercent;
        }
      }
    });
  }

  getParty() {
    this.api.getAllParty().subscribe(res => {
      this.party = res;
    })
  }
  PurchaseDetailModel: any[] = [];
  AddData() {
    this.purcDtl.push({
      no: 0, barCode: '', ItemName: '', quantity: '',
      bonusQuantity: 0, netQuantity: 0, purchasePrice: 0, subTotal: 0, discountByPercent: 0,
      discountByValue: 0, totalIncDisc: 0, gstByPercent: 0, gstByValue: 0, totalIncGst: 0, netRate: 0, salePrice: 0,
      saleDiscountByValue: 0, netSalePrice: 0, marginPercent: 0
    });
  }
  RemoveData() {
    this.purcDtl = [];
    this.resetTotals();
  }
  RemoveCol(index: number) {
    this.purcDtl.splice(index, 1);
    this.resetTotals();
    this.calculateTotals();
  }
  items: any = []
  getItems() {
    this.api.getAllItemsdetails().subscribe(res => {
      this.items = res;
    })
  }
  addPurchase() {
    const requiredFields = [
      { key: 'partyId', message: 'party Name is required.' },
      { key: 'invoiceNo', message: 'Invoice No is required.' },
    ];

    for (const field of requiredFields) {
      if (!this.formData[field.key]) {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: field.message });
        return;
      }
    }
    let formData: any = {
      id: this.urlId ? this.urlId : undefined,
      barCode: this.formData.barCode,
      VendorId: this.formData.partyId,
      Remarks: this.formData.remarks,
      InvoiceNo: this.formData.invoiceNo,
      purchasePrice: this.formData.purchasePrice,
      ItemsQuantity: this.totalQty,
      billTotal: this.totalNetSalePrice,
      gstByPercent: this.formData.gstByPercent,
      gstByValue: this.formData.gstByValue,
      netRate: this.formData.netRate,
      salePrice: this.formData.salePrice,
      saleDiscountByValue: this.formData.saleDiscountByValue,
      marginPercent: this.formData.marginPercent,
      netSalePrice: this.formData.netSalePrice,
      netQuantity: this.netQuantity,
      totalDisc :this.totalDisc,
      totalGST :this.totalGST,
      netCostTotal :this.netCostTotal,
      netSaleTotal :this.netSaleTotal,
      netProfitInValue :this.netProfitInValue,
      PurchaseDetailModel: this.purcDtl
    };

    this.api.createPurchase(formData).subscribe(res => {
      if (res.msg = "Purchase Order processed successfully") {
        this.router.navigate(['purchase-list']);
        this.messageService.add({ severity: 'success', summary: 'Success', detail: "Purchase Saved Successfully" });
      }
    }, err => {
      console.error("Error saving purchase", err);
    });
  }
  cat: any = [];
  getCategory() {
    this.api.getAllCategorydetails().subscribe(res => {
      this.cat = res;
    })
  }
  exportPdf() {
    const doc = new jsPDF('l', 'mm', 'a4');
    doc.setFontSize(16);
    doc.text('Purchase Report', doc.internal.pageSize.getWidth() / 2, 15, { align: 'center' });


    // Define the table headers
    const headers = [
      'No', 'Bar Code', 'Item Name', 'Quantity', 'Bonus Quantity', 'Purchase Price',
      'Disc %', 'Disc Value', 'Total', 'GST %', 'GST Value', 'Net Rate', 'Sale Price',
      'Sale Disc', 'Margin %', 'Net Sale Price'
    ];

    // Prepare table data
    const tableData = this.purcDtl.map(user => [
      user.no,
      user.barcode,
      user.itemName,
      user.quantity,
      user.bonusQuantity,
      user.purchasePrice,
      user.discountByPercent,
      user.discountByValue,
      user.total,
      user.gstByPercent,
      user.gstByValue,
      user.netRate,
      user.salePrice,
      user.saleDiscountByValue,
      user.marginPercent,
      user.netSalePrice
    ]);
    const totals = {
      quantity: this.purcDtl.reduce((sum, item) => sum + (item.quantity || 0), 0),
      bonusQuantity: this.purcDtl.reduce((sum, item) => sum + (item.bonusQuantity || 0), 0),
      purchasePrice: this.purcDtl.reduce((sum, item) => sum + (item.purchasePrice || 0), 0),
      discountByPercent: this.purcDtl.reduce((sum, item) => sum + (item.discountByPercent || 0), 0),
      discountByValue: this.purcDtl.reduce((sum, item) => sum + (item.discountByValue || 0), 0),
      total: this.purcDtl.reduce((sum, item) => sum + (item.total || 0), 0),
      gstByPercent: this.purcDtl.reduce((sum, item) => sum + (item.gstByPercent || 0), 0),
      gstByValue: this.purcDtl.reduce((sum, item) => sum + (item.gstByValue || 0), 0),
      netRate: this.purcDtl.reduce((sum, item) => sum + (item.netRate || 0), 0),
      salePrice: this.purcDtl.reduce((sum, item) => sum + (item.salePrice || 0), 0),
      saleDiscountByValue: this.purcDtl.reduce((sum, item) => sum + (item.saleDiscountByValue || 0), 0),
      marginPercent: this.purcDtl.reduce((sum, item) => sum + (item.marginPercent || 0), 0),
      netSalePrice: this.purcDtl.reduce((sum, item) => sum + (item.netSalePrice || 0), 0)
    };

    // Generate main table
    autoTable(doc, {
      head: [headers],
      body: tableData,
      margin: { top: 30 }, // Add margin below the title
      styles: { fontSize: 8, cellPadding: 2, overflow: 'linebreak', halign: 'center' },
      theme: 'striped',
      didDrawPage: (dataArg) => {
        doc.text('Purchase Details', dataArg.settings.margin.left, 25);
      }
    });

    // Add a space between the tables
    doc.addPage();

    // Create the totals table
    const summaryHeaders = [
      'Quantity', 'Bonus Quantity', 'Purchase Price', 'Disc %', 'Disc Value', 'Total', 'GST %', 'GST Value', 'Net Rate', 'Sale Price', 'Sale Disc', 'Margin %', 'Net Sale Price'
    ];

    const summaryData = [[
      totals.quantity, totals.bonusQuantity, totals.purchasePrice, totals.discountByPercent,
      totals.discountByValue, totals.total, totals.gstByPercent, totals.gstByValue,
      totals.netRate, totals.salePrice, totals.saleDiscountByValue, totals.marginPercent, totals.netSalePrice
    ]];

    // Generate summary table
    autoTable(doc, {
      head: [summaryHeaders],
      body: summaryData,
      margin: { top: 10 },
      styles: { fontSize: 10, cellPadding: 3 },
      theme: 'grid',
      didDrawPage: (dataArg: { settings: { margin: { left: any; }; }; }) => {
        doc.text('Summary Totals', dataArg.settings.margin.left, 5);
      }
    });

    // Save the PDF
    doc.save('purchase-details-with-summary.pdf');
  }

}

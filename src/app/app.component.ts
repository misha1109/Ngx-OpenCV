import {AfterViewChecked, Component, ViewChild} from '@angular/core';
import {DomSanitizer} from '@angular/platform-browser';
import {MatStepper} from '@angular/material/stepper';
import {NgbModal, ModalDismissReasons} from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements AfterViewChecked {
  @ViewChild('stepper') private myStepper: MatStepper;
  closeResult = '';
  imageLoading: boolean;
  originalImage: any;
  originalUrl: string;
  modifiedImage: any;
  currentRotate = 90;
  showLink: boolean;
  cv: any;
  toolsApplied: any = [];
  tools = {
    Histogram: {
      Histogram: {
        func: (img, canvasEl) => {
          const src = this.cv.imread(img);
          this.cv.cvtColor(src, src, this.cv.COLOR_RGBA2GRAY, 0);
          const srcVec = new this.cv.MatVector();
          srcVec.push_back(src);
          const accumulate = false;
          const channels = [0];
          const histSize = [256];
          const ranges = [0, 255];
          const hist = new this.cv.Mat();
          const mask = new this.cv.Mat();
          const color = new this.cv.Scalar(255, 255, 255);
          const scale = 2;
          this.cv.calcHist(srcVec, channels, mask, hist, histSize, ranges, accumulate);
          const result = this.cv.minMaxLoc(hist, mask);
          const max = result.maxVal;
          const dst = new this.cv.Mat.zeros(src.rows, histSize[0] * scale,
            this.cv.CV_8UC3);
          for (let i = 0; i < histSize[0]; i++) {
            const binVal = hist.data32F[i] * src.rows / max;
            const point1 = new this.cv.Point(i * scale, src.rows - 1);
            const point2 = new this.cv.Point((i + 1) * scale - 1, src.rows - binVal);
            this.cv.rectangle(dst, point1, point2, color, this.cv.FILLED);
          }
          this.cv.imshow(canvasEl, dst);
          src.delete(); dst.delete(); srcVec.delete(); mask.delete(); hist.delete();
        },
        description: 'You can see the image and its histogram. (Remember, this histogram is drawn for grayscale image, not color image). Left region of histogram shows the amount of darker pixels in image and right region shows the amount of brighter pixels. From the histogram, you can see dark region is more than brighter region, and amount of midtones (pixel values in mid-range, say around 127) are very less.'
      }
    },
    'Changing Colorspaces': {
      CvtColorGray: {
        func: (img, canvasEl) => {
          const src = this.cv.imread(img);
          const dst = new this.cv.Mat();
          this.cv.cvtColor(src, dst, this.cv.COLOR_RGBA2GRAY, 0);
          this.cv.imshow(canvasEl, dst);
          src.delete(); dst.delete();
        },
        description: 'convert image to gray color-space.'
      },
      InRange: {
        func: (img, canvasEl) => {
          const src = this.cv.imread(img);
          const dst = new this.cv.Mat();
          const low = new this.cv.Mat(src.rows, src.cols, src.type(), [0, 0, 0, 0]);
          const high = new this.cv.Mat(src.rows, src.cols, src.type(), [150, 150, 150, 255]);
          this.cv.inRange(src, low, high, dst);
          this.cv.imshow(canvasEl, dst);
          src.delete(); dst.delete(); low.delete(); high.delete();
        },
        description: 'Checks if array elements lie between the elements of two other arrays.'
      }
    },
    Thresholding: {
      'Regular Threshold': {
        func: (img, canvasEl) => {
          const src = this.cv.imread(img);
          const dst = new this.cv.Mat();
          this.cv.threshold(src, dst, 177, 200, this.cv.THRESH_BINARY);
          this.cv.imshow(canvasEl, dst);
          src.delete();
          dst.delete();
        },
        description: ' If pixel value is greater than a threshold value, it is assigned one value (may be white), else it is assigned another value (may be black).'
      },
      'Adaptive Threshold': {
        func:  (img, canvasEl) => {
          const src = this.cv.imread(img);
          const dst = new this.cv.Mat();
          this.cv.cvtColor(src, src, this.cv.COLOR_RGBA2GRAY, 0);
          this.cv.adaptiveThreshold(src, dst, 200, this.cv.ADAPTIVE_THRESH_GAUSSIAN_C, this.cv.THRESH_BINARY, 3, 2);
          this.cv.imshow(canvasEl, dst);
          src.delete();
          dst.delete();
        },
        description: 'the algorithm calculate the threshold for a small regions of the image. So we get different thresholds for different regions of the same image and it gives us better results for images with varying illumination.'
      }
    },
    Smoothing: {
      Filter: {
        func: (img, canvasEl) => {
          const src = this.cv.imread(img);
          const dst = new this.cv.Mat();
          const M = this.cv.Mat.eye(3, 3, this.cv.CV_32FC1);
          const anchor = new this.cv.Point(-1, -1);
          this.cv.filter2D(src, dst, this.cv.CV_8U, M, anchor, 0, this.cv.BORDER_DEFAULT);
          this.cv.imshow(canvasEl, dst);
          src.delete(); dst.delete(); M.delete();
        },
        description: 'averaging filter.'
      },
      'Bilateral Filter': {
        func: (img, canvasEl) => {
          const src = this.cv.imread(img);
          const dst = new this.cv.Mat();
          this.cv.cvtColor(src, src, this.cv.COLOR_RGBA2RGB, 0);
          this.cv.bilateralFilter(src, dst, 9, 75, 75, this.cv.BORDER_DEFAULT);
          this.cv.imshow(canvasEl, dst);
          src.delete(); dst.delete();
        },
        description: 'cv.bilateralFilter() is highly effective in noise removal while keeping edges sharp.'
      },
      Blur: {
        func: (img, canvasEl) => {
          const src = this.cv.imread(img);
          const dst = new this.cv.Mat();
          const ksize = new this.cv.Size(3, 3);
          const anchor = new this.cv.Point(-1, -1);
          this.cv.blur(src, dst, ksize, anchor, this.cv.BORDER_DEFAULT);
          this.cv.imshow(canvasEl, dst);
          src.delete(); dst.delete();
        },
        description: 'Image blurring is achieved by convolving the image with a low-pass filter kernel. It is useful for removing noises. It actually removes high frequency content (eg: noise, edges) from the image. '
      },
      'Gaussian Blur': {
        func: (img, canvasEl) => {
          const src = this.cv.imread(img);
          const dst = new this.cv.Mat();
          const ksize = new this.cv.Size(3, 3);
          this.cv.GaussianBlur(src, dst, ksize, 0, 0, this.cv.BORDER_DEFAULT);
          this.cv.imshow(canvasEl, dst);
          src.delete(); dst.delete();
        },
        description: 'instead of box filter, gaussian kernel is used.'
      },
      'Median Blur': {
        func: (img, canvasEl) => {
          const src = this.cv.imread(img);
          const dst = new this.cv.Mat();
          this.cv.medianBlur(src, dst, 5);
          this.cv.imshow(canvasEl, dst);
          src.delete(); dst.delete();
        },
        description: 'the function cv.medianBlur() takes median of all the pixels under kernel area and central element is replaced with this median value. This is highly effective against salt-and-pepper noise in the images.'
      }
    },
    Gradients: {
      Sobel: {
        func: (img, canvasEl) => {
          const src = this.cv.imread(img);
          const dstx = new this.cv.Mat();
          this.cv.cvtColor(src, src, this.cv.COLOR_RGB2GRAY, 0);
          this.cv.Sobel(src, dstx, this.cv.CV_8U, 1, 0, 3, 1, 0, this.cv.BORDER_DEFAULT);
          this.cv.imshow(canvasEl, dstx);
          src.delete(); dstx.delete();
        },
        description: 'Sobel operators is a joint Gausssian smoothing plus differentiation operation, so it is more resistant to noise.'
      },
      'Laplacian Derivatives': {
        func: (img, canvasEl) => {
          const src = this.cv.imread(img);
          const dst = new this.cv.Mat();
          this.cv.cvtColor(src, src, this.cv.COLOR_RGB2GRAY, 0);
          this.cv.Laplacian(src, dst, this.cv.CV_8U, 1, 1, 0, this.cv.BORDER_DEFAULT);
          this.cv.imshow(canvasEl, dst);
          src.delete(); dst.delete();
        },
        description: 'It calculates the Laplacian of the image given by the relation, Δsrc=∂2src∂x2+∂2src∂y2 where each derivative is found using Sobel derivatives'
      }
    },

  };
  constructor(
    private sanitizer: DomSanitizer,
    private modalService: NgbModal
  ) {}
  ngAfterViewChecked() {
    try {
      // @ts-ignore
      this.cv = cv;
    } catch (e) {
    }
  }
  async imgLoaded(event) {
    this.toolsApplied = [];
    this.originalImage = this.sanitizer.bypassSecurityTrustUrl(URL.createObjectURL(event.target.files[0]));
    this.modifiedImage = this.originalImage;
    this.originalUrl = URL.createObjectURL(event.target.files[0]);
    await this.setOriginal( URL.createObjectURL(event.target.files[0]));
    this.myStepper.next();
  }
  setOriginal(src) {
    return new Promise( (res, rej) => {
      const canvas = document.getElementById('modImage');
      // @ts-ignore
      const ctx = canvas.getContext('2d');
      const image = new Image();
      image.onload = () => {
        const [width, height] = [image.width, image.height];
        // @ts-ignore
        canvas.width = width;
        // @ts-ignore
        canvas.height = height;
        ctx.drawImage(image, 0, 0, width, height);
        res();
      };
      image.src = src;
    });
  }
  async canvasReset() {
    const canvas = document.getElementById('modImage');
    // @ts-ignore
    const ctx = canvas.getContext('2d');
    // @ts-ignore
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    await this.setOriginal(this.originalUrl);
  }
  async runTool(toolCategory, toolName) {
    this.imageLoading = true;
    const canvas = document.getElementById('modImage');
    await this.canvasReset();
    const img = new Image();
    img.onload = () => {
      // this.tools[toolCategory][toolName].func(img, 'modImage');
      const currentFunc = {
        name: toolName,
        func: () => this.tools[toolCategory][toolName].func('modImage', 'modImage')
      };
      const found = this.toolsApplied.findIndex( func => func.name === currentFunc.name );
      if ( found !== -1 ) {
        this.toolsApplied.splice(found, 1);
      } else {
        this.toolsApplied.push(currentFunc);
      }
      this.toolsApplied.forEach( func => func.func());
      // @ts-ignore
      this.modifiedImage = canvas.toDataURL();
      setTimeout( () => this.imageLoading = false, 600);
    };
    img.src = this.originalUrl;
  }
  getKeys(obj) {
    if ( obj ) {
      return Object.keys(obj);
    }
  }
  setButtonStyle( toolName ) {
    return this.toolsApplied.findIndex( tool => tool.name === toolName );
  }
  finished() {
    this.showLink = true;
    this.myStepper.next();
  }
  showInfo() {

  }

  open(content) {
    this.modalService.open(content, {ariaLabelledBy: 'modal-basic-title'}).result.then((result) => {
      this.closeResult = `Closed with: ${result}`;
    }, (reason) => {
      this.closeResult = `Dismissed ${this.getDismissReason(reason)}`;
    });
  }

  private getDismissReason(reason: any): string {
    if (reason === ModalDismissReasons.ESC) {
      return 'by pressing ESC';
    } else if (reason === ModalDismissReasons.BACKDROP_CLICK) {
      return 'by clicking on a backdrop';
    } else {
      return `with: ${reason}`;
    }
  }
}

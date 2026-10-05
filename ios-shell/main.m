#import <UIKit/UIKit.h>
#import <WebKit/WebKit.h>

@interface AppDelegate : UIResponder <UIApplicationDelegate, WKNavigationDelegate>
@property (nonatomic, strong) UIWindow *window;
@property (nonatomic, strong) WKWebView *web;
@property (nonatomic, strong) NSTimer *batteryTimer;
@end

@implementation AppDelegate

- (void)pushBattery {
  [UIDevice currentDevice].batteryMonitoringEnabled = YES;
  float level = [UIDevice currentDevice].batteryLevel;
  if (level < 0 || !self.web) return;
  NSString *js = [NSString stringWithFormat:@"window.__mfyBattery=%f;try{window.dispatchEvent(new Event('mfy-battery'))}catch(e){}", level];
  [self.web evaluateJavaScript:js completionHandler:nil];
}

- (void)webView:(WKWebView *)webView didFinishNavigation:(WKNavigation *)navigation {
  (void)webView;
  (void)navigation;
  [self pushBattery];
}

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions {
  (void)application;
  (void)launchOptions;
  CGRect frame = [[UIScreen mainScreen] bounds];
  self.window = [[UIWindow alloc] initWithFrame:frame];
  UIViewController *root = [UIViewController new];
  root.view.backgroundColor = [UIColor blackColor];

  WKWebViewConfiguration *cfg = [WKWebViewConfiguration new];
  cfg.allowsInlineMediaPlayback = YES;
  cfg.mediaTypesRequiringUserActionForPlayback = WKAudiovisualMediaTypeNone;
  if (@available(iOS 10.0, *)) {
    cfg.allowsPictureInPictureMediaPlayback = YES;
  }

  WKWebView *web = [[WKWebView alloc] initWithFrame:root.view.bounds configuration:cfg];
  web.navigationDelegate = self;
  web.autoresizingMask = UIViewAutoresizingFlexibleWidth | UIViewAutoresizingFlexibleHeight;
  web.opaque = NO;
  web.backgroundColor = [UIColor blackColor];
  web.scrollView.contentInsetAdjustmentBehavior = UIScrollViewContentInsetAdjustmentNever;
  NSURL *url = [NSURL URLWithString:@"https://xami666999-lgtm.github.io/mfy/"];
  [web loadRequest:[NSURLRequest requestWithURL:url]];
  [root.view addSubview:web];
  self.web = web;

  self.window.rootViewController = root;
  self.window.backgroundColor = [UIColor blackColor];
  [self.window makeKeyAndVisible];

  self.batteryTimer = [NSTimer scheduledTimerWithTimeInterval:20 target:self selector:@selector(pushBattery) userInfo:nil repeats:YES];
  return YES;
}

@end

int main(int argc, char *argv[]) {
  @autoreleasepool {
    return UIApplicationMain(argc, argv, nil, NSStringFromClass([AppDelegate class]));
  }
}

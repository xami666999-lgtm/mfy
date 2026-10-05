#import <UIKit/UIKit.h>
#import <WebKit/WebKit.h>

@interface AppDelegate : UIResponder <UIApplicationDelegate>
@property (nonatomic, strong) UIWindow *window;
@end

@implementation AppDelegate

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
  web.autoresizingMask = UIViewAutoresizingFlexibleWidth | UIViewAutoresizingFlexibleHeight;
  web.opaque = NO;
  web.backgroundColor = [UIColor blackColor];
  web.scrollView.contentInsetAdjustmentBehavior = UIScrollViewContentInsetAdjustmentNever;
  NSURL *url = [NSURL URLWithString:@"https://xami666999-lgtm.github.io/mfy/"];
  [web loadRequest:[NSURLRequest requestWithURL:url]];
  [root.view addSubview:web];

  self.window.rootViewController = root;
  self.window.backgroundColor = [UIColor blackColor];
  [self.window makeKeyAndVisible];
  return YES;
}

@end

int main(int argc, char *argv[]) {
  @autoreleasepool {
    return UIApplicationMain(argc, argv, nil, NSStringFromClass([AppDelegate class]));
  }
}

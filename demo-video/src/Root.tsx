import {Composition} from 'remotion';
import {NullDemo} from './NullDemo';

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="NullDemo"
      component={NullDemo}
      durationInFrames={30 * 120} // 2 minutes at 30fps
      fps={30}
      width={1920}
      height={1080}
    />
  );
};
